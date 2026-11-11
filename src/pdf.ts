import { tr, getLocale } from './i18n';
import {translate,label,type Params} from './locales/core.mjs';
import { PDFDocument, rgb, PDFPage, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { template, photoUrl, api, fileData, type Version, type Settings, type Photo, type View } from './model';
const green = rgb(.12, .29, .24), ink = rgb(.16, .18, .17), grey = rgb(.45, .47, .45), line = rgb(.86, .87, .84);
async function imageOf(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(Error(tr("ui.drawingOrPhotoCouldNotBeLoadedCheck"))); img.src = src; }); }
async function drawing(v: Version, view: View) {
    const img = await imageOf(template(v.document.type, view, v.document.templateVersion || 1));
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 1860;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1440, 1860);
    ctx.drawImage(img, 0, 0, 1440, 1860);
    ctx.scale(3, 3);
    for (const i of v.document.items.filter(i => i.view === view && !i.cancelled)) {
        const x = Math.min(466, Math.max(14, i.x * 480)), y = Math.min(606, Math.max(14, i.y * 620));
        if (x !== i.x * 480 || y !== i.y * 620) {
            ctx.strokeStyle = '#235343';
            ctx.beginPath();
            ctx.moveTo(i.x * 480, i.y * 620);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        ctx.fillStyle = '#235343';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(i.number), x, y + .5);
    }
    return canvas.toDataURL('image/png');
}
async function photoImage(p: Photo) {
    const img = await imageOf(photoUrl(p)), scale = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    for (const [idx, a] of p.annotations.entries()) {
        ctx.strokeStyle = '#b95339';
        ctx.lineWidth = Math.max(3, c.width / 350);
        ctx.beginPath();
        ctx.ellipse((a.x + a.w / 2) * c.width, (a.y + a.h / 2) * c.height, a.w * c.width / 2, a.h * c.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        const size = Math.max(20, c.width / 45);
        ctx.fillStyle = '#b95339';
        ctx.fillRect(a.x * c.width, a.y * c.height, size * 1.4, size * 1.3);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size}px sans-serif`;
        ctx.fillText(String(idx + 1), a.x * c.width + size * .3, a.y * c.height + size);
    }
    return { url: c.toDataURL('image/jpeg', .9), ratio: img.width / img.height };
}
export async function exportPdf(v: Version, s: Settings) {
 const locale=getLocale();const tr=(key:string,params?:Params)=>translate(locale,key,params);const displayValue=(value:string)=>label(value,locale);
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const fontRes = await fetch('/fonts/regular.ttf');
    if (!fontRes.ok)
        throw Error(tr("ui.theLocalPdfFontIsUnavailable"));
    const font = await pdf.embedFont(await fontRes.arrayBuffer(), { subset: false });
    const latin=await pdf.embedFont(StandardFonts.Helvetica);
 const typeface=(value:string)=>/^[\x20-\x7e\u00b7]*$/.test(value)?latin:font;
 const measure=(value:string,size:number)=>typeface(value).widthOfTextAtSize(value,size);
 const chars = new Set(font.getCharacterSet());
    const safe = (text: string) => Array.from(text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')).map(c => { if (c === '\n' || chars.has(c.codePointAt(0)!))
        return c; throw Error(tr("ui.theLocalFontDoesNotSupport") + c + tr("ui.pleaseChangeThisCharacterAndTryAgain")); }).join('');
    let page!: PDFPage, y = 0;
    const W = 595.28, H = 841.89, M = 42;
    const text = (t: string, x: number, top: number, size = 10, color = ink) => { page.drawText(safe(t), { x, y: H - top - size, font:typeface(t), size, color }); };
    const rule = (top: number) => page.drawLine({ start: { x: M, y: H - top }, end: { x: W - M, y: H - top }, color: line, thickness: .6 });
    const newPage = (title = tr("ui.fittingAlterationSheet")) => { page = pdf.addPage([W, H]); text(s.studio || tr("ui.fitnote2"), M, 29, 10, green); text(`${v.document.number} · V${v.seq}`, W - 245, 29, 9, grey); rule(51); text(title, M, 68, 19, green); y = 106; };
    const ensure = (height: number) => { if (y + height > H - 68)
        newPage(tr("ui.fittingAlterationSheetContinued")); };
    const wrap = (input:string,width:number,size=10)=>{const out:string[]=[];for(const paragraph of safe(input).split('\n')){let line='';const tokens=paragraph.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|\s+|[^\x00-\x7F]|./gu)||[];for(const token of tokens){if(measure(line+token,size)<=width){line+=token;continue;}if(line.trim()){out.push(line.trimEnd());line='';}if(!token.trim())continue;for(const char of token){if(measure(line+char,size)>width&&line){out.push(line);line='';}line+=char;}}out.push(line.trimEnd());}return out;};
    const paragraph = (t: string, width = W - M * 2, size = 10, x = M) => { for (const l of wrap(t, width, size)) {
        ensure(size + 9);
        text(l, x, y, size);
        y += size + 7;
    } };
    newPage();
    paragraph(s.header || tr("ui.professionalFittingRecordTailoringHandover"), W - M * 2, 9);
    y += 7;
    const columns = (W - M * 2 - 24) / 2;
    for (const pair of [
        [[tr("ui.customer"), v.document.customer], [tr("ui.fittingDate"), v.document.date]],
        [[tr("ui.garment"), displayValue(v.document.type) + ' · ' + (v.document.name || tr("ui.untitled"))], [tr("ui.handledBy"), v.document.operator || tr("ui.notProvided")]],
        [[tr("ui.contactDetails"), v.document.contact || tr("ui.notProvided")], [tr("ui.recordState"), v.state === 'final' ? tr("ui.finalised") : tr("ui.draftNotFinalised")]]
    ]) {
        const lines = pair.map(([label, value]) => wrap(label + (locale==='en-US'?': ':'：') + value, columns, 10)), height = Math.max(...lines.map(l => l.length)) * 17 + 6;
        ensure(height);
        for (let col = 0; col < 2; col++)
            for (let row = 0; row < lines[col].length; row++)
                text(lines[col][row], M + col * (columns + 24), y + row * 17, 10);
        y += height;
    }
    if (v.document.note) {
        y += 5;
        paragraph(tr("ui.notes") + v.document.note);
    }
    y += 8;
    ensure(312);
    const chartTop = y, colW = (W - M * 2 - 16) / 2, chartH = 268, chartW = chartH * 480 / 620;
    for (const [idx, view] of (['front', 'back'] as View[]).entries()) {
        const img = await pdf.embedPng(await drawing(v, view));
        page.drawImage(img, { x: M + idx * (colW + 16) + (colW - chartW) / 2, y: H - chartTop - chartH, width: chartW, height: chartH });
        text(view === 'front' ? tr("ui.front2") : tr("ui.back2"), M + idx * (colW + 16) + colW / 2 - 30, chartTop + chartH, 9, grey);
    }
    y = chartTop + chartH + 28;
    ensure(44);
    rule(y);
    y += 13;
    paragraph(tr("ui.alterationInstructions"), W - M * 2, 13);
    y += 4;
    if (!v.document.items.length)
        paragraph(tr("ui.noAlterationsRecordedForThisFitting"), W - M * 2, 10);
    for (const item of v.document.items) {
        const title = `#${item.number}  ${displayValue(item.part) || tr("ui.partNotSpecified")}  /  ${item.view === 'front' ? tr("ui.front") : tr("ui.back")}${item.cancelled ? tr("ui.cancelled3") : ''}`;
        const content = `${displayValue(item.action)}${item.value ? ' ' + item.value + ' ' + item.unit : tr("ui.amountNotEntered")}${item.basis !== '未指定' ? ' · ' + displayValue(item.basis) : ''}  |  ${displayValue(item.status)}`;
        const lines = wrap(item.note ? tr("ui.instructions") + item.note : '', W - M * 2 - 12, 10);
        ensure(Math.min(130, 55 + lines.length * 17));
        text(title, M, y, 11, green);
        y += 21;
        paragraph(content, W - M * 2 - 12, 10, M + 6);
        if (item.note)
            paragraph(tr("ui.instructions") + item.note, W - M * 2 - 12, 10, M + 6);
        y += 10;
        ensure(2);
        rule(y);
        y += 13;
    }
    for (const p of v.document.photos) {
        newPage(tr("ui.fittingPhotosAndIssueNotes"));
        paragraph(p.name, W - M * 2, 10);
        if (p.note)
            paragraph(p.note);
        const img = await photoImage(p), embed = await pdf.embedJpg(img.url);
        const maxH = Math.min(390, H - y - 120), w = Math.min(W - M * 2, maxH * img.ratio), h = w / img.ratio;
        page.drawImage(embed, { x: (W - w) / 2, y: H - y - h, width: w, height: h });
        y += h + 18;
        for (const [idx, a] of p.annotations.entries()) {
            const nums = a.itemIds.map(id => v.document.items.find(i => i.id === id)?.number).filter(Boolean);
            paragraph(tr("ui.areaValuevalueValue", { p0: idx + 1, p1: nums.length ? tr("ui.linkedAlteration") + nums.join('、#') : '', p2: a.text || tr("ui.noDescription") }));
        }
    }
    const signature=tr('ui.tailorConfirmationCompletedOn'),disclaimer=tr('ui.useTheActualFittingAsYourReferenceDrawings');
    ensure(12+18+wrap(signature,W-M*2,10).length*17+7+wrap(disclaimer,W-M*2,8).length*15);
    y += 12;
    rule(y);
    y += 18;
    paragraph(signature, W - M * 2, 10);
    y += 7;
    paragraph(disclaimer, W - M * 2, 8);
    const pages = pdf.getPages();
    for (const [idx, p] of pages.entries()) {
        page = p;
        text(`${v.document.number} · V${v.seq} · ${v.document.date}`, M, H - 40, 8, grey);
        text(`${idx + 1} / ${pages.length}`, W - M - 40, H - 40, 8, grey);
    }
    pdf.setTitle(`${v.document.number} ${displayValue(v.document.type)} V${v.seq}`);
    pdf.setCreator(tr("ui.fitnote2"));
    const bytes = await pdf.save(), blob = new Blob([bytes as BlobPart], { type: 'application/pdf' }), name = `${v.document.number}_${displayValue(v.document.type)}_V${v.seq}.pdf`.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    await api('export', 'POST', { name, pdf: (await fileData(blob)).split(',')[1] });
    return { blob, name };
}
