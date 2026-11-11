import { tr } from './i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import { ConfirmProvider } from './dialog';
class Boundary extends React.Component<React.PropsWithChildren, {
    error: boolean;
}> {
    state = { error: false };
    static getDerivedStateFromError() { return { error: true }; }
    render() { return this.state.error ? <div style={{ padding: 60, fontFamily: 'sans-serif' }}><h1>{tr("ui.theInterfaceIsTemporarilyUnavailable")}</h1><p>{tr("ui.savedRecordsAreStillOnThisDevicePlease")}</p><button onClick={() => location.reload()}>{tr("ui.reopen")}</button></div> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<Boundary><ConfirmProvider><App /></ConfirmProvider></Boundary>);
