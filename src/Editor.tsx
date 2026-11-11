import { tr, displayValue, canonicalValue, translateMessage } from './i18n';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, MousePointer2, MapPin, ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Download, Save, Check, CheckCircle2, Loader2, History as HistoryIcon, Image as ImageIcon, Shirt, Trash2, ArrowUp, ArrowDown, X, Lock, PenLine, Upload, AlertTriangle, FileText, ChevronRight, Copy, RotateCcw, Info, Eye, ExternalLink } from 'lucide-react';
import { Button, Badge, Field } from './App';
import { useConfirm } from './dialog';
import { api, uid, template, photoUrl, parts, actions, statuses, diff, fileData, download, type Doc, type Item, type Photo, type Annotation, type Version, type Settings, type View } from './model';
const PdfPreview = React.lazy(() => import('./PdfPreview'));
type Props = {
 returnToArchive?:boolean;
    initial: Version;
    settings: Settings;
    notify: (s: string, e?: boolean) => void;
    onClose: () => void;
    onVersion: (v: Version) => void;
};
export default function Editor({ initial, settings, notify, onClose, onVersion, returnToArchive }: Props) {
    const ask = useConfirm();
    const [v, setV] = useState(initial), [doc, setDoc] = useState<Doc>(initial.document), [view, setView] = useState<View>('front'), [selected, setSelected] = useState(''), [mode, setMode] = useState<'select' | 'pin'>('pin'), [zoom, setZoom] = useState(1), [fit, setFit] = useState(.65), [tab, setTab] = useState<'drawing' | 'photos'>('drawing'), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(''), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(''), [history, setHistory] = useState(false), [info, setInfo] = useState(false), [preview, setPreview] = useState<{
        url: string;
        blob: Blob;
        name: string;
    } | null>(null), [undoCount, setUndoCount] = useState(0), [redoCount, setRedoCount] = useState(0);
    const docRef = useRef(doc), vRef = useRef(v), saved = useRef(JSON.stringify(doc)), undos = useRef<Doc[]>([]), redos = useRef<Doc[]>([]), saveQueue = useRef<Promise<any>>(Promise.resolve()), mounted = useRef(true), svg = useRef<SVGSVGElement>(null), drag = useRef<{
        id: string;
        start: Doc;
        moved: boolean;
        clientX: number;
        clientY: number;
    } | null>(null);
    const readOnly = v.state === 'final';
    const drawingArea = useRef<HTMLDivElement>(null), navigationBypass = useRef(false);
    useEffect(() => {
        const el = drawingArea.current;
        if (!el)
            return;
        const resize = () => setFit(Math.max(.25, Math.min(1.4, (el.clientWidth - 72) / 480, (el.clientHeight - 126) / 620)));
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        resize();
        return () => observer.disconnect();
    }, [tab]);
    useEffect(() => () => { mounted.current = false; }, []);
    const assign = (d: Doc) => { docRef.current = d; setDoc(d); setDirty(JSON.stringify(d) !== saved.current); };
    const update = (fn: (d: Doc) => Doc, record = true) => {
        if (readOnly || busy)
            return;
        const old = docRef.current, next = fn(structuredClone(old));
        if (JSON.stringify(old) === JSON.stringify(next))
            return;
        if (record) {
            undos.current.push(old);
            if (undos.current.length > 100)
                undos.current.shift();
            redos.current = [];
            setUndoCount(undos.current.length);
            setRedoCount(0);
        }
        assign(next);
    };
    const undo = () => {
        if (readOnly || busy || !undos.current.length)
            return;
        redos.current.push(docRef.current);
        assign(undos.current.pop()!);
        setUndoCount(undos.current.length);
        setRedoCount(redos.current.length);
    };
    const redo = () => {
        if (readOnly || busy || !redos.current.length)
            return;
        undos.current.push(docRef.current);
        assign(redos.current.pop()!);
        setUndoCount(undos.current.length);
        setRedoCount(redos.current.length);
    };
    const save = useCallback(async () => {
        const work = async () => {
            const snapshot = docRef.current;
            if (vRef.current.state === 'final' || JSON.stringify(snapshot) === saved.current)
                return vRef.current;
            setSaving(true);
            setSaveError('');
            try {
                const next = await api<Version>(`versions/${vRef.current.id}`, 'PUT', { document: snapshot, revision: vRef.current.revision });
                vRef.current = next;
                saved.current = JSON.stringify(snapshot);
                if (mounted.current) {
                    setV(next);
                    setDirty(JSON.stringify(docRef.current) !== saved.current);
                }
                return next;
            }
            catch (e) {
                if (mounted.current)
                    setSaveError((e as Error).message);
                throw e;
            }
            finally {
                if (mounted.current)
                    setSaving(false);
            }
        };
        const queued = saveQueue.current.catch(() => { }).then(work);
        saveQueue.current = queued;
        return queued;
    }, []);
    useEffect(() => {
        if (!dirty || readOnly)
            return;
        const t = setTimeout(() => { save().catch(() => { }); }, 950);
        return () => clearTimeout(t);
    }, [doc, dirty, readOnly, save]);
    useEffect(() => {
        const before = (e: BeforeUnloadEvent) => {
            if (JSON.stringify(docRef.current) !== saved.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', before);
        return () => window.removeEventListener('beforeunload', before);
    }, []);
    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            const input = (e.target as HTMLElement).closest('input,textarea,select,[contenteditable]');
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                save().catch(e => notify(e.message, true));
            }
            if (!input && (e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                e.shiftKey ? redo() : undo();
            }
            if (!input && (e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Escape')
                setSelected('');
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    });
    const safeLeave = async (action: () => void) => {
        if (JSON.stringify(docRef.current) !== saved.current) {
            try {
                await save();
            }
            catch (e) {
                notify((e as Error).message, true);
                if (!await ask(tr("ui.yourChangesHaveNotBeenSavedLeavingWill")))
                    return;
            }
        }
        action();
    };
    // Guard sidebar navigation while this editor owns unsaved changes.
    useEffect(() => {
        const guard = (e: MouseEvent) => {
            if (navigationBypass.current)
                return;
            const target = (e.target as HTMLElement).closest('.sidebar button');
            if (target && JSON.stringify(docRef.current) !== saved.current) {
                e.preventDefault();
                e.stopPropagation();
                safeLeave(() => { navigationBypass.current = true; (target as HTMLButtonElement).click(); navigationBypass.current = false; });
            }
        };
        document.addEventListener('click', guard, true);
        return () => document.removeEventListener('click', guard, true);
    });
    const point = (e: {
        clientX: number;
        clientY: number;
    }) => {
        const el = svg.current;
        if (!el)
            return null;
        const matrix = el.getScreenCTM();
        if (!matrix)
            return null;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
        return { x: Math.max(0, Math.min(1, p.x / 480)), y: Math.max(0, Math.min(1, p.y / 620)) };
    };
    const add = (e: React.PointerEvent) => {
        if (readOnly || mode !== 'pin' || e.button !== 0)
            return;
        const p = point(e);
        if (!p)
            return;
        const item: Item = { id: uid(), number: Math.max(0, ...docRef.current.items.map(i => i.number)) + 1, view, ...p, part: '', action: '收窄', value: '', unit: settings.unit || 'cm', basis: '未指定', note: '', status: '待处理', cancelled: false };
        update(d => ({ ...d, items: [...d.items, item] }));
        setSelected(item.id);
    };
    const patchItem = (id: string, patch: Partial<Item>) => update(d => ({ ...d, items: d.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
    const remove = (id: string) => { update(d => ({ ...d, items: d.items.filter(i => i.id !== id), photos: d.photos.map(p => ({ ...p, annotations: p.annotations.map(a => ({ ...a, itemIds: a.itemIds.filter(x => x !== id) })) })) })); setSelected(''); notify(tr("ui.alterationDeletedUseUndoToRestoreIt")); };
    const select = (id: string) => {
        setSelected(id);
        const i = docRef.current.items.find(i => i.id === id);
        if (i)
            setView(i.view);
        setTimeout(() => document.getElementById('item-' + id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
    };
    const move = (id: string, delta: number) => update(d => {
        const idx = d.items.findIndex(i => i.id === id), to = idx + delta;
        if (to < 0 || to >= d.items.length)
            return d;
        [d.items[idx], d.items[to]] = [d.items[to], d.items[idx]];
        return d;
    });
    const finalize = async () => {
        if (!await ask(tr("ui.finalisingMakesThisFittingReadOnlyCreateA")))
            return;
        setBusy('final');
        try {
            await save();
            const next = await api<Version>(`versions/${v.id}/finalize`, 'POST', { revision: vRef.current.revision });
            vRef.current = next;
            setV(next);
            notify(tr("ui.fittingFinalisedItsHistoryIsNowProtected"));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
        finally {
            setBusy('');
        }
    };
    const nextVersion = async () => {
        setBusy('next');
        try {
            onVersion(await api<Version>(`versions/${v.id}/next`, 'POST', {}));
            notify(tr("ui.newFittingVersionCreatedThePreviousVersionIs"));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
        finally {
            setBusy('');
        }
    };
    const pdf = async () => {
        setBusy('pdf');
        try {
            await save();
            const { exportPdf } = await import('./pdf');
            const result = await exportPdf({ ...vRef.current, document: docRef.current }, settings);
            setPreview(old => {
                if (old)
                    URL.revokeObjectURL(old.url);
                return { blob: result.blob, name: result.name, url: URL.createObjectURL(result.blob) };
            });
            notify(tr("ui.pdfCreatedAndSavedToTheLocalExports"));
        }
        catch (e) {
            notify(tr("ui.pdfExportFailed") + (e as Error).message, true);
        }
        finally {
            setBusy('');
        }
    };
    useEffect(() => () => {
        if (preview)
            URL.revokeObjectURL(preview.url);
    }, [preview]);
    const item = doc.items.find(i => i.id === selected), activeItems = doc.items.filter(i => !i.cancelled), complete = activeItems.filter(i => i.status === '已完成').length;
    return <div className="editor"><div className="editor-title"><div className="editor-title-left"><button className="icon-button" title={returnToArchive?tr("archive.back"):tr("ui.backToRecords")} onClick={() => safeLeave(onClose)}><ArrowLeft size={19}/></button><div><div className="editor-order-number">{doc.number} <span>V{v.seq} · {readOnly ? tr("ui.finalised") : tr("ui.fittingDraft")}</span></div><h1>{doc.name || displayValue(doc.type)}<span>{doc.customer}</span></h1></div></div><div className="editor-title-actions"><span className={'save-state ' + (saveError ? 'failed' : '')}>{saveError ? <AlertTriangle size={14}/> : saving ? <Loader2 size={14} className="spin"/> : dirty ? <ClockIcon /> : <Check size={14}/>} {saveError ? tr("ui.saveFailed") : saving ? tr("ui.saving") : dirty ? tr("ui.unsavedChanges") : tr("ui.savedLocally2")}</span><Button onClick={() => setHistory(true)}><HistoryIcon size={16}/>{tr("ui.fittingHistory")}</Button><Button primary disabled={!!busy || saving} onClick={pdf}>{busy === 'pdf' ? <Loader2 size={16} className="spin"/> : <Download size={16}/>}{tr("ui.previewAndExport")}</Button></div></div>
 {saveError && <div className="inline-error"><AlertTriangle size={16}/><span>{translateMessage(saveError)}{tr("ui.yourChangesAreStillInTheEditor")}</span><button onClick={() => save().catch(() => { })}>{tr("ui.retrySave")}</button></div>}
 <div className="editor-info"><span>{displayValue(doc.type)}</span><span>{tr("ui.fittingDate") + " "}{doc.date}</span><span>{tr("ui.handledBy") + " "}{doc.operator || tr("ui.notProvided")}</span><button onClick={() => setInfo(true)}><PenLine size={13}/>{readOnly ? tr("ui.viewDetails") : tr("ui.editDetails")}</button><div className="editor-info-right">{readOnly ? <><Lock size={13}/>{tr("ui.finalisedHistoryIsReadOnly") + " "}<button disabled={!!busy} onClick={nextVersion}><Plus size={13}/>{tr("ui.newFitting")}</button></> : <button disabled={saving || !!busy} onClick={finalize}><CheckCircle2 size={13}/>{tr("ui.finaliseFitting")}</button>}</div></div>
 <div className="editor-body"><section className="drawing-panel"><div className="canvas-toolbar"><div className="segmented"><button className={tab === 'drawing' ? 'selected' : ''} onClick={() => setTab('drawing')}><Shirt size={16}/>{tr("ui.garmentDrawing")}</button><button className={tab === 'photos' ? 'selected' : ''} onClick={() => setTab('photos')}><ImageIcon size={16}/>{tr("ui.fittingPhotos") + " "}<small>{doc.photos.length}</small></button></div><div className="canvas-tools">{tab === 'drawing' && <><button className={mode === 'select' ? 'active' : ''} title={tr("ui.selectAndDrag")} onClick={() => setMode('select')}><MousePointer2 size={17}/></button><button disabled={readOnly} className={mode === 'pin' ? 'active' : ''} title={tr("ui.clickToAddAMark")} onClick={() => setMode('pin')}><MapPin size={17}/></button><span className="tool-divider"/></>}<button title={tr("ui.undo")} disabled={!undoCount || readOnly} onClick={undo}><Undo2 size={17}/></button><button title={tr("ui.redo")} disabled={!redoCount || readOnly} onClick={redo}><Redo2 size={17}/></button></div></div>
 {tab === 'drawing' ? <><div className="drawing-scroll" ref={drawingArea}><div className="drawing-meta"><span>{tr("ui.garmentOutline") + " "}<i>GARMENT DRAWING</i></span><span>{tr("ui.templateV")}{doc.templateVersion || 1}</span></div><div className="view-switch segmented"><button className={view === 'front' ? 'selected' : ''} onClick={() => setView('front')}>{tr("ui.front")}</button><button className={view === 'back' ? 'selected' : ''} onClick={() => setView('back')}>{tr("ui.back")}</button></div><div className="svg-holder" style={{ width: 480 * zoom * fit, height: 620 * zoom * fit }}><svg ref={svg} viewBox="0 0 480 620" role="img" aria-label={tr("ui.valueValueAlterationDrawing", { p0: displayValue(doc.type), p1: view === 'front' ? tr("ui.front") : tr("ui.back") })} className={mode === 'pin' && !readOnly ? 'pin-mode' : ''} onPointerDown={add} onPointerMove={e => {
                if (!drag.current || readOnly)
                    return;
                if (Math.abs(e.clientX - drag.current.clientX) + Math.abs(e.clientY - drag.current.clientY) < 3 && !drag.current.moved)
                    return;
                const p = point(e);
                if (p) {
                    drag.current.moved = true;
                    update(d => ({ ...d, items: d.items.map(i => i.id === drag.current!.id ? { ...i, ...p } : i) }), false);
                }
            }} onPointerUp={() => {
                if (drag.current?.moved) {
                    undos.current.push(drag.current.start);
                    redos.current = [];
                    setUndoCount(undos.current.length);
                    setRedoCount(0);
                }
                drag.current = null;
            }} onPointerCancel={() => {
                if (drag.current) {
                    assign(drag.current.start);
                    drag.current = null;
                }
            }}><image href={template(doc.type, view, doc.templateVersion || 1)} width="480" height="620"/>{doc.items.filter(i => i.view === view).map(i => <g key={i.id} role="button" aria-label={tr("ui.markValueValue", { p0: i.number, p1: displayValue(i.part) })} tabIndex={0} className={'svg-marker ' + (i.id === selected ? 'selected ' : '') + (i.cancelled ? 'cancelled' : '')} transform={`translate(${i.x * 480},${i.y * 620}) scale(${1 / fit})`} onKeyDown={e => {
                    if (e.key === 'Enter')
                        select(i.id);
                }} onPointerDown={e => {
                    e.stopPropagation();
                    select(i.id);
                    if (!readOnly) {
                        svg.current?.setPointerCapture(e.pointerId);
                        drag.current = { id: i.id, start: docRef.current, moved: false, clientX: e.clientX, clientY: e.clientY };
                    }
                }}><circle className="marker-halo" r="19"/><circle r="12" fill={i.cancelled ? '#929891' : i.status === '已完成' ? '#597661' : i.id === selected ? '#ad8347' : '#1c4c40'}/><text textAnchor="middle" dy="4.2">{i.number}</text></g>)}</svg></div><div className="drawing-caption">{view === 'front' ? tr("ui.frontView") : tr("ui.backView")}<span>{tr("ui.positionReferenceOnlyNotAMeasurementGuide")}</span></div></div><div className="canvas-footer"><span><MapPin size={14}/>{readOnly ? tr("ui.finalisedReadOnly") : mode === 'pin' ? tr("ui.clickToAddAMarkDragMarksTo") : tr("ui.clickAMarkToViewDragToReposition")}</span><div><button title={tr("ui.zoomOutDrawing")} onClick={() => setZoom(z => Math.max(.5, z - .1))}><ZoomOut size={16}/></button><span>{Math.round(zoom * 100)}%</span><button title={tr("ui.zoomInDrawing")} onClick={() => setZoom(z => Math.min(2.5, z + .1))}><ZoomIn size={16}/></button><button title={tr("ui.fitToCanvas")} onClick={() => setZoom(1)}><Maximize size={15}/></button></div></div></> : <PhotoPanel doc={doc} readOnly={readOnly} update={update} notify={notify} selectedItem={selected}/>}
 </section><aside className="details-panel"><div className="details-heading"><div><h2>{tr("ui.alterationDetails") + " "}<span>{doc.items.length.toString().padStart(2, '0')}</span></h2><p>{tr("ui.markAPositionEnterChangesExport")}</p></div><Badge text={readOnly ? tr("ui.finalised") : tr("ui.editing")}/></div><div className="progress-row"><span>{tr("ui.completed") + " "}{complete} / {activeItems.length}</span><div><i style={{ width: `${activeItems.length ? complete / activeItems.length * 100 : 0}%` }}/></div></div><div className="item-list">{doc.items.length ? doc.items.map((i, idx) => <div id={'item-' + i.id} key={i.id} className={'item-card ' + (selected === i.id ? 'selected ' : '') + (i.cancelled ? 'cancelled' : '')}><button className="item-card-main" onClick={() => select(i.id)}><span className="item-number">{String(i.number).padStart(2, '0')}</span><div><strong>{displayValue(i.part) || tr("ui.chooseAGarmentPart")} <small>{i.view === 'front' ? tr("ui.front") : tr("ui.back")}</small></strong><p>{displayValue(i.action)}{i.value && <> <b>{i.value} {i.unit}</b></>}{i.cancelled && tr("ui.cancelled")}</p></div><Badge text={i.status}/></button>{selected === i.id && <div className="item-editor"><div className="two-fields"><Field label={tr("ui.garmentPart")}><input list="garment-parts" placeholder={tr("ui.selectOrEnterAPart")} value={displayValue(i.part)} readOnly={readOnly} maxLength={200} onChange={e => patchItem(i.id, { part: canonicalValue(e.target.value) })}/><datalist id="garment-parts">{parts[doc.type].map(p => <option key={p} value={displayValue(p)}/>)}</datalist></Field><Field label={tr("ui.alterationAction")}><input list="action-list" value={displayValue(i.action)} readOnly={readOnly} maxLength={200} onChange={e => patchItem(i.id, { action: canonicalValue(e.target.value) })}/><datalist id="action-list">{actions.map(a => <option key={a} value={displayValue(a)}/>)}</datalist></Field></div><div className="two-fields"><Field label={tr("ui.adjustmentAmount")}><input inputMode="decimal" placeholder={tr("ui.enteredByTheTailor")} value={i.value} readOnly={readOnly} onChange={e => {
                    if (/^\d{0,5}(\.\d{0,3})?$/.test(e.target.value))
                        patchItem(i.id, { value: e.target.value });
                }}/></Field><Field label={tr("ui.unit")}><select disabled={readOnly} value={i.unit} onChange={e => patchItem(i.id, { unit: e.target.value })}><option value="cm">{tr("ui.cmCentimetres")}</option><option value="mm">{tr("ui.mmMillimetres")}</option><option value="in">{tr("ui.inInches")}</option></select></Field></div><details className="item-advanced"><summary>{tr("ui.instructionsAndStatus") + " "}<span>{tr("ui.optional")}</span></summary><Field label={tr("ui.measurementBasis")}><select disabled={readOnly} value={i.basis} onChange={e => patchItem(i.id, { basis: e.target.value })}>{['未指定', '单侧', '整圈', '平量', '其他'].map(x => <option key={x} value={x}>{displayValue(x)}</option>)}</select></Field><Field label={tr("ui.constructionAlterationNotes")}><textarea rows={2} maxLength={5000} readOnly={readOnly} placeholder={tr("ui.eGKeepBothSidesSymmetricalAndPreserve")} value={i.note} onChange={e => patchItem(i.id, { note: e.target.value })}/></Field><Field label={tr("ui.progressStatus")}><select disabled={readOnly} value={i.status} onChange={e => patchItem(i.id, { status: e.target.value })}>{statuses.map(s => <option key={s} value={s}>{displayValue(s)}</option>)}</select></Field></details>{!readOnly && <div className="item-actions"><button title={tr("ui.moveItemUp")} disabled={idx === 0} onClick={() => move(i.id, -1)}><ArrowUp size={14}/></button><button title={tr("ui.moveItemDown")} disabled={idx === doc.items.length - 1} onClick={() => move(i.id, 1)}><ArrowDown size={14}/></button><button onClick={() => patchItem(i.id, { cancelled: !i.cancelled })}>{i.cancelled ? tr("ui.restoreAlteration") : tr("ui.cancelAlteration")}</button><button className="danger" title={tr("ui.deleteAlteration")} onClick={() => remove(i.id)}><Trash2 size={14}/></button></div>}{!readOnly && <Button className="continue-marking" onClick={() => { setSelected(''); setMode('pin'); }}>{tr("ui.doneAddAnotherMark") + " "}<MapPin size={13}/></Button>}</div>}</div>) : <div className="details-empty"><div><MapPin size={27}/></div><h3>{tr("ui.markEachAlterationOnTheDrawing")}</h3><p>{tr("ui.clickTheDrawingToAddYourFirstMark")}<br />{tr("ui.thenEnterThePartAmountAndInstructions")}</p><span>{tr("ui.justEnterThePartActionAndAmount")}<br />{tr("ui.addOtherDetailsWhenNeeded")}</span></div>}</div><div className="details-bottom"><Info size={14}/><span>{tr("ui.multipleIndependentAlterationsCanShareTheSameGarment")}</span></div></aside></div>
 {info && <div className="modal-backdrop"><div className="modal info-modal"><div className="modal-heading"><h2>{tr("ui.recordDetails")}</h2><button className="icon-button" onClick={() => setInfo(false)}><X size={20}/></button></div><div className="form-grid">{(['number', 'customer', 'name', 'contact', 'date', 'operator'] as const).map((k, idx) => <Field key={k} label={[tr("ui.recordNumber"), tr("ui.customerNameReference"), tr("ui.garmentName"), tr("ui.contactDetails"), tr("ui.fittingDate"), tr("ui.handledBy")][idx]}><input type={k === 'date' ? 'date' : 'text'} readOnly={readOnly} maxLength={200} value={doc[k]} onChange={e => update(d => ({ ...d, [k]: e.target.value }))}/></Field>)}</div><Field label={tr("ui.fittingNotes")}><textarea rows={3} readOnly={readOnly} maxLength={5000} value={doc.note} onChange={e => update(d => ({ ...d, note: e.target.value }))}/></Field><Button primary onClick={() => setInfo(false)}>{tr("ui.done")}</Button></div></div>}
 {history && <HistoryModal current={v} currentDoc={doc} onClose={() => setHistory(false)} onOpen={next => safeLeave(() => { setHistory(false); onVersion(next); })} notify={notify}/>}
 {preview && <div className="modal-backdrop"><div className="modal pdf-modal"><div className="modal-heading"><div><h2>{tr("ui.alterationSheetPreview")}</h2><p>{preview.name} · A4</p></div><div><Button onClick={() => download(preview.blob, preview.name)}><Download size={15}/>{tr("ui.downloadPdf")}</Button><Button onClick={() => window.open(preview.url, '_blank', 'noopener')}><ExternalLink size={15}/>{tr("ui.openForPrinting")}</Button><button className="icon-button" aria-label={tr("ui.closePreview")} onClick={() => setPreview(null)}><X size={20}/></button></div></div><React.Suspense fallback={<div className="empty"><Loader2 className="spin"/></div>}><PdfPreview blob={preview.blob}/></React.Suspense></div></div>}
 </div>;
}
function ClockIcon() { return <span className="unsaved-dot"/>; }
function PhotoPanel({ doc, readOnly, update, notify, selectedItem }: {
    doc: Doc;
    readOnly: boolean;
    update: (fn: (d: Doc) => Doc, record?: boolean) => void;
    notify: (s: string, e?: boolean) => void;
    selectedItem: string;
}) {
    const [selected, setSelected] = useState(doc.photos[0]?.id || ''), [aId, setAId] = useState(''), [zoom, setZoom] = useState(1), [busy, setBusy] = useState(false), [missing, setMissing] = useState(false), [draft, setDraft] = useState<Annotation | null>(null), [drawMode, setDrawMode] = useState(true);
    const file = useRef<HTMLInputElement>(null), svg = useRef<SVGSVGElement>(null), start = useRef<{
        x: number;
        y: number;
    } | null>(null), [ratio, setRatio] = useState(1.25);
    const photo = doc.photos.find(p => p.id === selected) || doc.photos[0], annotation = photo?.annotations.find(a => a.id === aId);
    useEffect(() => {
        setMissing(false);
        setAId('');
        if (photo) {
            const img = new Image();
            img.onload = () => setRatio(img.width / img.height);
            img.onerror = () => setMissing(true);
            img.src = photoUrl(photo);
        }
    }, [photo?.path]);
    const patchPhoto = (fn: (p: Photo) => Photo) => {
        if (!photo)
            return;
        update(d => ({ ...d, photos: d.photos.map(p => p.id === photo.id ? fn(p) : p) }));
    };
    const point = (e: React.PointerEvent) => {
        const m = svg.current?.getScreenCTM();
        if (!m)
            return null;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
        return { x: Math.min(1, Math.max(0, p.x / 1000)), y: Math.min(1, Math.max(0, p.y / (1000 / ratio))) };
    };
    const importFiles = async (files: FileList | null) => {
        if (!files)
            return;
        setBusy(true);
        try {
            if (doc.photos.length + files.length > 100)
                throw Error(tr("ui.eachVersionSupportsUpTo100Photos"));
            for (const f of Array.from(files)) {
                if (f.size > 15 * 1024 * 1024)
                    throw Error(tr("ui.valueExceeds15mb", { p0: f.name }));
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
                    throw Error(tr("ui.onlyJpgPngAndWebpAreSupported"));
                await new Promise<void>((resolve, reject) => {
                    const img = new Image(), url = URL.createObjectURL(f);
                    img.onload = () => {
                        URL.revokeObjectURL(url);
                        if (img.width * img.height > 40000000)
                            reject(Error(tr("ui.imageIsTooLargeResizeItTo40")));
                        else
                            resolve();
                    };
                    img.onerror = () => { URL.revokeObjectURL(url); reject(Error(tr("ui.imageIsDamagedOrCannotBeRead"))); };
                    img.src = url;
                });
                const r = await fetch('/api/photos', { method: 'POST', headers: { 'X-FitNote-Request': 'local' }, body: f });
                const b = await r.json();
                if (!r.ok)
                    throw Error(b.error);
                const p: Photo = { id: uid(), path: b.path, name: f.name, note: '', annotations: [] };
                update(d => ({ ...d, photos: [...d.photos, p] }));
                setSelected(p.id);
            }
            notify(tr("ui.photoImportedTheOriginalIsPreserved"));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
        finally {
            setBusy(false);
            if (file.current)
                file.current.value = '';
        }
    };
    return <div className="photo-panel"><div className="photo-toolbar"><span>{tr("ui.originalPreservedNonDestructiveAnnotations")}</span><div>{photo && <><button title={tr("ui.zoomOutPhoto")} onClick={() => setZoom(z => Math.max(.5, z - .25))}><ZoomOut size={16}/></button><span>{Math.round(zoom * 100)}%</span><button title={tr("ui.zoomInPhoto")} onClick={() => setZoom(z => Math.min(3, z + .25))}><ZoomIn size={16}/></button><button className={drawMode ? 'active' : ''} disabled={readOnly} onClick={() => setDrawMode(!drawMode)}>{tr("ui.circleAnArea")}</button></>}<Button disabled={readOnly || busy} onClick={() => file.current?.click()}>{busy ? <Loader2 className="spin" size={15}/> : <Upload size={15}/>}{tr("ui.importPhotos")}</Button><input ref={file} hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={e => importFiles(e.target.files)}/></div></div>{photo ? <><div className="photo-strip">{doc.photos.map(p => <button key={p.id} className={p.id === photo.id ? 'selected' : ''} onClick={() => setSelected(p.id)}><img src={photoUrl(p)} alt={p.name}/></button>)}</div><div className="photo-scroll">{missing ? <div className="empty"><AlertTriangle /><h3>{tr("ui.photoIsMissingOrCannotBeRead")}</h3><p>{tr("ui.theRecordIsStillAvailableRestoreMissingAttachments")}</p></div> : <svg ref={svg} style={{ width: Math.max(300, 540 * zoom), maxWidth: 'none', aspectRatio: ratio }} viewBox={`0 0 1000 ${1000 / ratio}`} className={drawMode ? 'photo-draw' : ''} onPointerDown={e => {
                    if (readOnly || !drawMode)
                        return;
                    const p = point(e);
                    if (p) {
                        start.current = p;
                        svg.current?.setPointerCapture(e.pointerId);
                        setDraft({ id: uid(), ...p, w: 0, h: 0, text: '', itemIds: selectedItem ? [selectedItem] : [] });
                    }
                }} onPointerMove={e => {
                    if (!start.current)
                        return;
                    const p = point(e);
                    if (p)
                        setDraft(a => a ? { ...a, x: Math.min(p.x, start.current!.x), y: Math.min(p.y, start.current!.y), w: Math.abs(p.x - start.current!.x), h: Math.abs(p.y - start.current!.y) } : a);
                }} onPointerUp={() => {
                    if (draft && draft.w > .005 && draft.h > .005) {
                        patchPhoto(p => ({ ...p, annotations: [...p.annotations, draft] }));
                        setAId(draft.id);
                    }
                    setDraft(null);
                    start.current = null;
                }} onPointerCancel={() => { setDraft(null); start.current = null; }}><image href={photoUrl(photo)} width="1000" height={1000 / ratio}/>{[...photo.annotations, ...(draft ? [draft] : [])].map((a, idx) => <g key={a.id} onPointerDown={e => { e.stopPropagation(); setAId(a.id); }}><ellipse cx={(a.x + a.w / 2) * 1000} cy={(a.y + a.h / 2) * 1000 / ratio} rx={a.w * 500} ry={a.h * 500 / ratio} fill="none" stroke={aId === a.id ? '#e7b55d' : '#e26748'} strokeWidth="4"/><rect x={a.x * 1000} y={a.y * 1000 / ratio} width="28" height="26" fill="#b65238"/><text x={a.x * 1000 + 14} y={a.y * 1000 / ratio + 19} fill="white" textAnchor="middle" fontSize="18">{idx + 1}</text></g>)}</svg>}</div><div className="photo-info"><div className="photo-name"><strong>{photo.name}</strong>{!readOnly && <button className="danger" onClick={() => { update(d => ({ ...d, photos: d.photos.filter(p => p.id !== photo.id) })); }}><Trash2 size={15}/>{tr("ui.removePhoto")}</button>}</div><Field label={tr("ui.photoNotes")}><input readOnly={readOnly} maxLength={5000} placeholder={tr("ui.describeTheFittingIssueInThisPhoto")} value={photo.note} onChange={e => patchPhoto(p => ({ ...p, note: e.target.value }))}/></Field><div className="annotation-list">{photo.annotations.map((a, idx) => <button key={a.id} className={a.id === aId ? 'selected' : ''} onClick={() => setAId(a.id)}>{tr("ui.area") + " "}{idx + 1}{a.text ? ' · ' + a.text.slice(0, 10) : ''}</button>)}</div>{annotation && <div className="annotation-editor"><Field label={tr("ui.areaDescription")}><input maxLength={5000} readOnly={readOnly} value={annotation.text} onChange={e => patchPhoto(p => ({ ...p, annotations: p.annotations.map(a => a.id === annotation.id ? { ...a, text: e.target.value } : a) }))}/></Field><Field label={tr("ui.linkToAnAlteration")}><select disabled={readOnly} value={annotation.itemIds[0] || ''} onChange={e => patchPhoto(p => ({ ...p, annotations: p.annotations.map(a => a.id === annotation.id ? { ...a, itemIds: e.target.value ? [e.target.value] : [] } : a) }))}><option value="">{tr("ui.noLinkedAlteration")}</option>{doc.items.map(i => <option key={i.id} value={i.id}>#{i.number} {displayValue(i.part)} · {i.action} {i.value} {i.unit}</option>)}</select></Field>{!readOnly && <button className="text-button danger" onClick={() => patchPhoto(p => ({ ...p, annotations: p.annotations.filter(a => a.id !== annotation.id) }))}><Trash2 size={14}/>{tr("ui.deleteArea")}</button>}</div>}</div></> : <div className="empty photo-empty"><ImageIcon size={38}/><h3>{tr("ui.keepARecordOfTheRealFittingDetails")}</h3><p>{tr("ui.importJpgPngOrWebpPhotosCircleIssues")}<br />{tr("ui.annotationsAreSavedSeparatelyOriginalPhotosStayUnchanged")}</p><Button disabled={readOnly || busy} onClick={() => file.current?.click()}><Plus size={16}/>{tr("ui.importYourFirstPhoto")}</Button><small>{tr("ui.upTo15mbPerPhotoStoredOnlyOn")}</small></div>}</div>;
}
function HistoryModal({ current, currentDoc, onClose, onOpen, notify }: {
    current: Version;
    currentDoc: Doc;
    onClose: () => void;
    onOpen: (v: Version) => void;
    notify: (s: string, e?: boolean) => void;
}) {
    const [versions, setVersions] = useState<Version[]>([]), [selected, setSelected] = useState(current.id), [base, setBase] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState(''), [track, setTrack] = useState('');
    useEffect(() => { api<Version[]>(`orders/${current.order_id}/history`).then(v => { const list = v.map(x => x.id === current.id ? { ...current, document: currentDoc } : x); setVersions(list); const idx = list.findIndex(x => x.id === selected); setBase(list[idx + 1]?.id || ''); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
    const v = versions.find(x => x.id === selected), b = versions.find(x => x.id === base), changes = v ? diff(b?.document || { ...v.document, items: [] }, v.document) : [];
    return <div className="modal-backdrop"><div className="modal history-modal"><div className="modal-heading"><div><div className="eyebrow">FITTING JOURNEY</div><h2>{tr("ui.fittingHistoryAndVersionComparison")}</h2><p>{tr("ui.eachFittingIsSavedSeparatelyKeepingEveryChange")}</p></div><button className="icon-button" onClick={onClose}><X size={20}/></button></div>{loading ? <div className="empty"><Loader2 className="spin"/></div> : error ? <div className="empty"><AlertTriangle /><p>{translateMessage(error)}</p></div> : <div className="history-body"><aside>{versions.map((x, idx) => <button className={selected === x.id ? 'selected' : ''} key={x.id} onClick={() => { setSelected(x.id); setBase(versions[idx + 1]?.id || ''); setTrack(''); }}><span className="version-node">V{x.seq}</span><div><strong>{x.document.date}</strong><small>{x.state === 'final' ? tr("ui.finalisedReadOnly2") : tr("ui.currentDraft")} · {tr('items.count',{count:x.document.items.length})}</small></div><ChevronRight size={15}/></button>)}</aside><section>{v && <><div className="history-comparison"><div><h3>V{v.seq} · {v.document.date}</h3><p>{v.document.customer} / {v.document.name || displayValue(v.document.type)}</p></div><Button onClick={() => onOpen(v)}><Eye size={15}/>{tr("ui.openThisVersion")}</Button></div><Field label={tr("ui.compareWith")}><select value={base} onChange={e => setBase(e.target.value)}><option value="">{tr("ui.initialEmptyRecord")}</option>{versions.filter(x => x.seq < v.seq).map(x => <option key={x.id} value={x.id}>V{x.seq} · {x.document.date}</option>)}</select></Field><div className="diff-list">{changes.length ? changes.map(c => <button key={c.item.id} className={'diff-card ' + (track === c.item.id ? 'selected' : '')} onClick={() => setTrack(c.item.id)}><span className={'diff-tag kind-' + c.kind}>{displayValue(c.kind)}</span><div><strong>#{c.item.number} {displayValue(c.item.part) || tr("ui.partNotSpecified")}</strong><p>{displayValue(c.item.action)} {c.item.value} {c.item.unit} · {displayValue(c.item.status)}</p>{c.prev && c.kind === '调整' && <small>{tr("ui.previously")}{displayValue(c.prev.part)} · {displayValue(c.prev.action)} {c.prev.value} {c.prev.unit} · {displayValue(c.prev.status)} {c.prev.note}</small>}{c.item.note && <small>{c.item.note}</small>}</div></button>) : <div className="empty"><p>{tr("ui.thisVersionHasNoAlterationsYet")}</p></div>}</div>{track && <div className="tracking"><h3>{tr("ui.fullHistoryOfThisAlteration")}</h3>{[...versions].reverse().map(x => { const i = x.document.items.find(i => i.id === track); return i ? <p key={x.id}><b>V{x.seq}</b><span>{x.document.date}</span>{i.cancelled ? tr("ui.cancelled2") : `${displayValue(i.action)} ${i.value} ${i.unit} · ${displayValue(i.status)}`}</p> : null; })}</div>}</>}</section></div>}</div></div>;
}
