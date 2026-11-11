import { tr, useLanguage, translateMessage } from './i18n';
import React, { createContext, useContext, useRef, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
const Context = createContext<(message: string) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Context);
export function ConfirmProvider({ children }: React.PropsWithChildren) { useLanguage();
    const [message, setMessage] = useState(''), pending = useRef<((answer: boolean) => void) | null>(null);
    const ask = (text: string) => {
        if (pending.current)
            return Promise.resolve(false);
        return new Promise<boolean>(resolve => { pending.current = resolve; setMessage(text); });
    };
    const answer = (value: boolean) => { const done = pending.current; pending.current = null; setMessage(''); done?.(value); };
    return <Context.Provider value={ask}>{children}{message && <div className="modal-backdrop confirmation-layer" onKeyDown={e => {
                if (e.key === 'Escape')
                    answer(false);
            }}><section className="modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><div className="modal-heading"><h2 id="confirmation-title">{tr("ui.confirmAction")}</h2><button className="icon-button" aria-label={tr("ui.cancelAction")} onClick={() => answer(false)}><X size={18}/></button></div><p>{translateMessage(message)}</p><div className="confirmation-buttons"><button autoFocus className="button" onClick={() => answer(false)}>{tr("ui.notNow")}</button><button className="button primary" onClick={() => answer(true)}>{tr("ui.continue")}</button></div></section></div>}</Context.Provider>;
}
