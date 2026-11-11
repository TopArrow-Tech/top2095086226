import { tr, useLanguage, translateMessage } from './i18n';
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker.js';
export default function PdfPreview({ blob }: {
    blob: Blob;
}) {
    const language=useLanguage();
 const host = useRef<HTMLDivElement>(null), [busy, setBusy] = useState(true), [error, setError] = useState('');
    useEffect(() => {
        let cancelled = false, task: ReturnType<typeof pdfjs.getDocument> | undefined;
        async function render() {
            try {
                setBusy(true);
                setError('');
                const data = new Uint8Array(await blob.arrayBuffer());
                if (cancelled)
                    return;
                task = pdfjs.getDocument({ data });
                const doc = await task.promise;
                if (!host.current || cancelled)
                    return;
                host.current.replaceChildren();
                for (let i = 1; i <= doc.numPages; i++) {
                    if (cancelled)
                        return;
                    const page = await doc.getPage(i), width = Math.max(300, Math.min(880, (host.current.clientWidth || 720) - 32)), base = page.getViewport({ scale: 1 }), scale = width / base.width, viewport = page.getViewport({ scale: scale * Math.min(2, devicePixelRatio || 1) }), canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = width + 'px';
                    canvas.style.height = width * base.height / base.width + 'px';
                    canvas.setAttribute('aria-label', tr("ui.pdfPageValue", { p0: i }));
                    canvas.setAttribute('role', 'img');
                    host.current.append(canvas);
                    await page.render({ canvas, viewport }).promise;
                }
                if (!cancelled)
                    setBusy(false);
            }
            catch (e) {
                if (!cancelled) {
                    setError((e as Error).message);
                    setBusy(false);
                }
            }
        }
        render();
        return () => { cancelled = true; task?.destroy(); };
    }, [blob,language]);
    return <div className="pdf-render-wrap">{busy && <div className="pdf-loading"><Loader2 className="spin" size={20}/>{tr("ui.renderingPrintPages")}</div>}{error && <div className="empty"><AlertTriangle /><h3>{tr("ui.previewIsUnavailable")}</h3><p>{translateMessage(error)}</p><p>{tr("ui.downloadThePdfAndOpenItInYour")}</p></div>}<div className="pdf-pages" ref={host}/></div>;
}
