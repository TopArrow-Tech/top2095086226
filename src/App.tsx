import appInfo from '../package.json';
const APP_VERSION=appInfo.version;
import { tr, displayValue, useLanguage, setLocale, getLocale, translateMessage } from './i18n';
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Trash2, LayoutDashboard, Files, Plus, ArrowUpRight, ArrowLeft, ChevronRight, Search, Clock, Check, CheckCircle2, Archive, Copy, ShieldCheck, Scissors, Pin, Shirt, Save, X, Loader2, AlertCircle, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { api, blank, garmentTypes, statusOf, template, today, type Doc, type Version, type Order, type Settings } from './model';
import Editor from './Editor';
import Backups from './Backups';
import { useConfirm } from './dialog';
type Page = 'home' | 'orders' | 'archive' | 'new' | 'editor' | 'settings';
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');
export function Button({ children, onClick, primary = false, className = '', disabled = false, type = 'button', title }: React.PropsWithChildren<{
    onClick?: () => void;
    primary?: boolean;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
    title?: string;
}>) { return <button type={type} className={cn('button', primary && 'primary', className)} onClick={onClick} disabled={disabled} title={title}>{children}</button>; }
export function Badge({ text }: {
    text: string;
}) { return <span className={'badge ' + ({ '已完成': 'done', '修改中': 'progress', '需复核': 'review', '已归档': 'archived' }[text] || 'pending')}><i />{displayValue(text)}</span>; }
export function Field({ label, children, required = false }: {
    label: string;
    children: React.ReactNode;
    required?: boolean;
}) { return <label className="field"><span>{label}{required && <em> *</em>}</span>{children}</label>; }
export default function App() {
 const language=useLanguage(),ask=useConfirm();
 const [deleting,setDeleting]=useState('');
 const [returnPage,setReturnPage]=useState<'orders'|'archive'>('orders');
    const [page, setPage] = useState<Page>('home'), [orders, setOrders] = useState<Order[]>([]), [settings, setSettings] = useState<Settings>({}), [dataDir, setDataDir] = useState(''), [version, setVersion] = useState<Version | null>(null), [loading, setLoading] = useState(true), [fatal, setFatal] = useState(''), [toast, setToast] = useState<{
        text: string;
        error: boolean;
    } | null>(null), [search, setSearch] = useState(''), [filter, setFilter] = useState('全部'), [typeFilter, setTypeFilter] = useState('全部服装'), [sort, setSort] = useState('updated'), [busy, setBusy] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notify = (text: string, error = false) => { text=translateMessage(text);
        setToast({ text, error });
        if (toastTimer.current)
            clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), error ? 9000 : 4500);
    };
    async function reload() {
        try {
            const b = await api('bootstrap');
            setLocale(b.settings.locale||'zh-CN');setOrders(b.orders);
            setSettings(b.settings);
            setDataDir(b.dataDir);
            setFatal('');
        }
        catch (e) {
            setFatal((e as Error).message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { reload(); }, []);
    const go = (p: Page) => {
        setPage(p);
        if (p !== 'editor') {
            setVersion(null);
            reload();
        }
    };
    const open = async (o: Order) => {
        try {
            const v = await api<Version>('versions/' + o.version_id);setReturnPage(o.archived?'archive':'orders');
            setVersion(v);
            setPage('editor');
        }
        catch (e) {
            notify((e as Error).message, true);
        }
    };
    const created = (v: Version) => {setReturnPage('orders'); setVersion(v); setPage('editor'); reload(); notify(tr("ui.recordCreatedClickTheDrawingToAddAn")); };
    const duplicate = async (o: Order) => {
        try {
            const d = structuredClone(o.document);
            d.number = blank().number;
            d.date = today();
            const ids = new Map(d.items.map(i => [i.id, crypto.randomUUID()]));
            d.items = d.items.map(i => ({ ...i, id: ids.get(i.id)!, status: '待处理' }));
            d.photos = d.photos.map(p => ({ ...p, id: crypto.randomUUID(), annotations: p.annotations.map(a => ({ ...a, id: crypto.randomUUID(), itemIds: a.itemIds.map(id => ids.get(id)!).filter(Boolean) })) }));
            created(await api<Version>('orders', 'POST', d));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
    };
    const archive = async (o: Order) => {
        try {
            await api(`orders/${o.id}/archive`, 'POST', { archived: !o.archived });
            reload();
            notify(o.archived ? tr("ui.recordRestoredToActiveRecords") : tr("ui.recordArchivedFindItInArchiveInThe"));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
    };
    const deleteOrder=async(o:Order)=>{if(!await ask(tr('delete.confirm',{number:o.number})))return;setDeleting(o.id);try{const result=await api('orders/'+o.id,'DELETE',{number:o.number});await reload();notify(tr(result.cleanupWarnings?'delete.cleanupWarning':'delete.done'));}catch(e){notify((e as Error).message,true);}finally{setDeleting('');}};
    const active = orders.filter(o => !o.archived), pending = active.filter(o => statusOf(o.document) !== '已完成'), done = active.filter(o => statusOf(o.document) === '已完成');
    const filtered = orders.filter(o => (page === 'archive' ? !!o.archived && (filter === '全部' || statusOf(o.document) === filter) : !o.archived && (filter === '全部' || (filter === '未完成' ? statusOf(o.document) !== '已完成' : statusOf(o.document) === filter))) && (typeFilter === '全部服装' || o.document.type === typeFilter) && `${o.number} ${o.document.customer} ${o.document.name} ${o.document.contact}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'date' ? b.document.date.localeCompare(a.document.date) : b.updated_at.localeCompare(a.updated_at));
    const orderRow = (o: Order) => <div className="order-row" key={o.id}><button className="order-title" onClick={() => open(o)}><span className="garment-thumb"><img src={template(o.document.type, 'front')} alt=""/></span><span><strong>{o.document.name || displayValue(o.document.type)}</strong><small>{o.number}{!!o.archived && tr("ui.archived2")}</small></span></button><span className="customer-cell">{o.document.customer}</span><span className="type-cell">{displayValue(o.document.type)}</span><span><Badge text={statusOf(o.document)}/></span><span className="date-cell">{o.document.date}<small>V{o.seq} · {tr('items.count',{count:o.document.items.filter(i=>!i.cancelled).length})}</small></span><div className="row-actions"><button title={tr("ui.duplicateRecord")} onClick={() => duplicate(o)}><Copy size={16}/></button><button className={o.archived ? 'restore-order' : ''} title={o.archived ? tr("ui.restoreRecord") : tr("ui.archiveRecord")} onClick={() => archive(o)}>{o.archived ? <><RefreshCw size={16}/><span>{tr("ui.restore")}</span></> : <Archive size={16}/>}</button>{!!o.archived&&<button className="delete-order danger" title={tr('delete.title')} disabled={!!deleting} onClick={()=>deleteOrder(o)}>{deleting===o.id?<Loader2 size={15} className="spin"/>:<Trash2 size={15}/>}<span>{tr('delete.label')}</span></button>}<button title={tr("ui.openRecord")} onClick={() => open(o)}><ArrowUpRight size={18}/></button></div></div>;
    return <div className="app"><aside className="sidebar"><button className="brand" onClick={() => go('home')}><img src="/icon.png" alt={tr("ui.fitnote")}/><span>{language==='zh-CN'?tr("ui.fitnote")+' ':''}<b>FitNote</b><small>{tr("ui.fittingAlterationsClearlyMarked")}</small></span></button><div className="sidebar-label">{tr("ui.workspace") + " "}<span>WORKSPACE</span></div><nav>{[["home", LayoutDashboard, tr("ui.dashboard")], ['orders', Files, tr("ui.alterationRecords")], ['archive', Archive, tr("ui.archive")], ['new', Plus, tr("ui.newRecord")]].map(([id, Icon, label]) => {
            const I = Icon as typeof Files;
            return <button key={String(id)} className={cn('nav-item', page === id && 'active')} onClick={() => {
                    if (id === 'orders' || id === 'archive') {
                        setFilter('全部');
                        setSearch('');
                        setTypeFilter('全部服装');
                    }
                    go(id as Page);
                }}><I size={19}/><span>{String(label)}</span>{(id === 'orders' || id === 'archive') && <small>{id === 'orders' ? active.length : orders.filter(o => o.archived).length}</small>}</button>;
        })}</nav><div className="sidebar-note"><span className="tiny-rule"/><Scissors size={24}/><h3>{tr("ui.everyAlteration")}<br />{tr("ui.deservesAPreciseRecord")}</h3><p>{tr("ui.fromFittingToHandover")}<br />{tr("ui.letCraftsmanshipSpeakClearly")}</p></div><div className="sidebar-bottom"><button className={cn('nav-item', page === 'settings' && 'active')} onClick={() => go('settings')}><SettingsIcon size={19}/>{tr("ui.studioSettings")}</button><div className="local-state"><span /><div>{tr("ui.localWorkspace")}<small>{tr("ui.storedOnlyOnThisDevice")}</small></div><ShieldCheck size={16}/></div><p className="side-version">FITNOTE <span>v{APP_VERSION}</span></p></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumb">{tr("ui.myStudio") + " "}<ChevronRight size={13}/><strong>{page === 'home' ? tr("ui.dashboard") : page === 'orders' ? tr("ui.alterationRecords") : page === 'archive' ? tr("ui.archive") : page === 'new' ? tr("ui.newRecord") : page === 'settings' ? tr("ui.studioSettings") : tr("ui.fittingEditor")}</strong><span className="app-version" title={tr("ui.applicationVersion")}>v{APP_VERSION}</span></div><div className="topbar-right"><LanguageSwitch onChanged={locale=>setSettings(current=>({...current,locale}))}/><span className="offline-dot"/>{tr("ui.worksOffline")}<span className="topbar-divider"/><span className="studio-avatar">{(settings.studio || tr("ui.fitnote")).slice(0, 1)}</span><span>{settings.studio || tr("ui.myStudio")}</span></div></header>
 {loading ? <div className="loading-screen"><Loader2 className="spin"/>{tr("ui.openingYourLocalWorkspace")}</div> : fatal ? <div className="empty"><AlertCircle /><h2>{tr("ui.workspaceIsUnavailable")}</h2><p>{translateMessage(fatal)}</p><Button onClick={() => { setLoading(true); reload(); }}>{tr("ui.tryAgain")}</Button></div> : page === 'editor' && version ? <Editor key={version.id} initial={version} settings={settings} notify={notify} onClose={() => go(returnPage)} returnToArchive={returnPage==='archive'} onVersion={v => { setVersion(v); reload(); }}/> : page === 'new' ? <NewOrder settings={settings} onCreate={created} onCancel={() => go('home')} notify={notify}/> : page === 'settings' ? <SettingsPage onRestored={reload} settings={settings} dataDir={dataDir} onSaved={s => { setSettings(s); notify(tr("ui.studioSettingsSaved")); }} notify={notify}/> : <main className="page-content">
 {page === 'home' ? <><div className="page-heading"><div><div className="eyebrow">THE FITTING ATELIER</div><h1>{tr("ui.aBetterFitStartsHere")}<span className="heading-dot">{language==='zh-CN'?'。':'.'}</span></h1><p>{tr("ui.turnFittingDetailsIntoClearPreciseAlterationInstructions")}</p></div><span className="today">{new Date().toLocaleDateString(language, { month: 'long', day: 'numeric', weekday: 'long' })}</span></div><section className="hero"><div className="hero-copy"><div className="eyebrow brass">PRECISION IN EVERY DETAIL</div><h2>{tr("ui.aWellMadeGarment")}<br />{tr("ui.aPerfectFitInEveryDetail")}</h2><p>{tr("ui.markTheDrawingRefineTheDetails")}<br />{tr("ui.keepAProfessionalRecordForTheNextFitting")}</p><Button primary onClick={() => go('new')}><Plus size={17}/>{tr("ui.newRecord") + " "}<ArrowUpRight size={17}/></Button><div className="hero-foot"><span />{tr("ui.savedLocally") + " "}<i />{tr("ui.noAccountNeeded") + " "}<i />{tr("ui.madeForFittings")}</div></div><div className="hero-art"><div className="art-rule top"/><span className="art-caption">THE ART OF A PERFECT FIT</span><img src={template('西装上衣', 'front')} alt={tr("ui.originalTailoredJacketIllustration")}/><div className="art-marker shoulder"><span>01</span><i /><small>{tr("ui.preciseRecords")}</small></div><div className="art-marker cuff"><small>{tr("ui.detailsThatMatter")}</small><i /><span>02</span></div><span className="art-bottom">FIG. 01 — TAILORED JACKET</span><div className="art-rule bottom"/></div></section><section className="stats"><button onClick={() => { setFilter('全部'); go('orders'); }}><span className="stat-icon"><Files size={21}/></span><div><p>{tr("ui.allActiveRecords")}</p><strong>{String(active.length).padStart(2, '0')}</strong></div><ArrowUpRight size={16}/></button><button onClick={() => { setFilter('未完成'); go('orders'); }}><span className="stat-icon amber"><Clock size={21}/></span><div><p>{tr("ui.pendingAndInProgress")}</p><strong>{String(pending.length).padStart(2, '0')}</strong></div><span className="stat-hint">{tr("ui.readyForRefinement")}</span></button><button onClick={() => { setFilter('已完成'); go('orders'); }}><span className="stat-icon"><CheckCircle2 size={21}/></span><div><p>{tr("ui.completedRecords")}</p><strong>{String(done.length).padStart(2, '0')}</strong></div><span className="stat-hint">{tr("ui.everyDetailJustRight")}</span></button></section><div className="section-heading"><div><h2>{tr("ui.recentlyEdited") + " "}<span>RECENT WORK</span></h2><p>{tr("ui.continueYourLatestFitting")}</p></div><button className="text-button" onClick={() => { setFilter('全部'); go('orders'); }}>{tr("ui.viewAll") + " "}<ArrowRight size={15}/></button></div><section className="orders-table"><div className="order-row table-head"><span>{tr("ui.garmentRecord")}</span><span>{tr("ui.customer")}</span><span>{tr("ui.garmentType")}</span><span>{tr("ui.status")}</span><span>{tr("ui.fittingDate")}</span><span /></div>{active.length ? active.slice(0, 4).map(orderRow) : <div className="welcome-empty"><div className="empty-line-icon"><Pin size={28}/></div><div><h3>{tr("ui.yourFirstProfessionalRecordStartsWithAMark")}</h3><p>{tr("ui.chooseATemplateRecordFittingDetailsAndPrepare")}</p></div><Button onClick={() => go('new')}>{tr("ui.createYourFirstRecord") + " "}<Plus size={16}/></Button></div>}</section><div className="home-footer"><span><ShieldCheck size={15}/>{tr("ui.yourRecordsStayOnThisDeviceFocusOn")}</span><span>{tr("ui.fitnoteMadeForABetterFit")}</span></div></> : <><div className="page-heading"><div><div className="eyebrow">FITTING RECORDS</div><h1>{page === 'archive' ? tr("ui.archive") : tr("ui.alterationRecords")}</h1><p>{page === 'archive' ? tr("ui.archivedRecordsKeepAllDetailsAndFittingHistory") : tr("ui.keepEveryFittingDetailWithinReach")}</p></div>{page==='archive'?null:<Button primary onClick={() => go('new')}><Plus size={17}/>{tr("ui.newRecord")}</Button>}</div>{page==='archive'&&<div className="archive-notice"><Archive size={17}/><span>{tr("ui.archivingKeepsYourDataRestoringReturnsTheRecord")}</span><button onClick={()=>{setFilter('全部');go('orders')}}>{tr("ui.backToActiveRecords")}<ArrowRight size={14}/></button></div>}<div className="list-toolbar"><div className="tabs">{(page === 'archive' ? ['全部', '待处理', '修改中', '需复核', '已完成'] : ['全部', '未完成', '待处理', '修改中', '需复核', '已完成']).map(f => <button className={filter === f ? 'selected' : ''} key={f} onClick={() => setFilter(f)}>{displayValue(f)}</button>)}</div><div className="filter-row"><div className="search-field"><Search size={17}/><input aria-label={tr("ui.searchRecords")} placeholder={tr("ui.searchCustomerRecordNumberOrGarment")} value={search} onChange={e => setSearch(e.target.value)}/></div><select aria-label={tr("ui.filterGarments")} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>{['全部服装', ...garmentTypes].map(t => <option key={t} value={t}>{displayValue(t)}</option>)}</select><select aria-label={tr("ui.sortRecords")} value={sort} onChange={e => setSort(e.target.value)}><option value="updated">{tr("ui.recentlyEditedFirst")}</option><option value="date">{tr("ui.latestFittingFirst")}</option></select></div></div><div className={cn("orders-table", page === 'archive' && 'archive-table')}><div className="order-row table-head"><span>{tr("ui.garmentRecord")}</span><span>{tr("ui.customer")}</span><span>{tr("ui.garmentType")}</span><span>{tr("ui.status")}</span><span>{tr("ui.fittingDate")}</span><span /></div>{filtered.length ? filtered.map(orderRow) : <div className="empty"><Files size={32}/><h3>{search ? tr("ui.noMatchingRecords") : page === 'archive' ? tr("ui.noArchivedRecordsYet") : tr("ui.noAlterationRecordsYet")}</h3><p>{search ? tr("ui.tryAnotherCustomerRecordNumberOrGarmentName") : page === 'archive' ? tr("ui.recordsArchivedFromTheRecordsListWillAppear") : tr("ui.createAnAlterationRecordAndMarkTheFitting")}</p><Button onClick={() => go('new')}><Plus size={16}/>{tr("ui.newRecord")}</Button></div>}</div><p className="list-total">{tr('records.total',{count:filtered.length})}</p></>}
 </main>}</div>{toast && <div role="status" className={cn('toast', toast.error && 'error')}>{toast.error ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>}<span>{translateMessage(toast.text)}</span><button onClick={() => setToast(null)} aria-label={tr("ui.dismissNotification")}><X size={16}/></button></div>}</div>;
}
function NewOrder({ settings, onCreate, onCancel, notify }: {
    settings: Settings;
    onCreate: (v: Version) => void;
    onCancel: () => void;
    notify: (s: string, e?: boolean) => void;
}) {
    const [d, setD] = useState<Doc>(blank), [busy, setBusy] = useState(false);
    const patch = (k: keyof Doc, v: string) => setD({ ...d, [k]: v });
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            onCreate(await api<Version>('orders', 'POST', d));
        }
        catch (e) {
            notify((e as Error).message, true);
        }
        finally {
            setBusy(false);
        }
    };
    return <main className="page-content new-page"><button className="text-button back" onClick={onCancel}><ArrowLeft size={16}/>{tr("ui.backToDashboard")}</button><div className="page-heading"><div><div className="eyebrow">A NEW FITTING</div><h1>{tr("ui.startANewFittingRecord")}</h1><p>{tr("ui.enterACustomerNameChooseAGarmentAnd")}</p></div><span className="step-label">{tr("ui.01Details") + " "}<ChevronRight size={14}/>{tr("ui.02FittingMarks")}</span></div><form onSubmit={submit}><section className="form-card"><div className="card-title"><span>01</span><div><h2>{tr("ui.basicDetails")}</h2><p>{tr("ui.oneRecordPerGarmentEachFittingKeepsIts")}</p></div></div><div className="form-grid"><Field label={tr("ui.customerNameReference")} required><input required autoFocus maxLength={200} placeholder={tr("ui.eGMsChenC021")} value={d.customer} onChange={e => patch('customer', e.target.value)}/></Field><Field label={tr("ui.garmentNameOptional")}><input maxLength={200} placeholder={tr("ui.eGNavyWoolTwoButtonJacket")} value={d.name} onChange={e => patch('name', e.target.value)}/></Field></div><details className="optional-panel"><summary>{tr("ui.additionalDetails") + " "}<span>{tr("ui.numberAndDateAreFilledAutomaticallyAddThe")}</span></summary><div className="form-grid"><Field label={tr("ui.recordNumber")} required><input required maxLength={200} value={d.number} onChange={e => patch('number', e.target.value)}/></Field><Field label={tr("ui.fittingDate")} required><input required type="date" value={d.date} onChange={e => patch('date', e.target.value)}/></Field><Field label={tr("ui.contactDetailsOptional")}><input maxLength={200} placeholder={tr("ui.storedOnlyOnThisDevice2")} value={d.contact} onChange={e => patch('contact', e.target.value)}/></Field><Field label={tr("ui.handledByOptional")}><input maxLength={200} placeholder={tr("ui.personRecordingThisFitting")} value={d.operator} onChange={e => patch('operator', e.target.value)}/></Field></div><Field label={tr("ui.fittingNotes")}><textarea rows={2} maxLength={5000} value={d.note} onChange={e => patch('note', e.target.value)} placeholder={tr("ui.customerPreferencesOrOverallConstructionRequirements")}/></Field></details></section><section className="form-card"><div className="card-title"><span>02</span><div><h2>{tr("ui.chooseAGarmentTemplate")}</h2><p>{tr("ui.originalGarmentOutlinesEachWithFrontAndBack")}</p></div></div><div className="template-options">{garmentTypes.map(t => <button type="button" key={t} className={cn('template-option', d.type === t && 'chosen')} onClick={() => patch('type', t)}>{d.type === t && <span className="template-check"><Check size={13}/></span>}<img src={template(t, 'front')} alt={displayValue(t)}/><strong>{displayValue(t)}</strong><small>{tr("ui.frontBack")}</small></button>)}</div></section><div className="form-bottom"><span><Lock size={14}/>{tr("ui.customerInformationStaysOnThisDevice")}</span><div><Button onClick={onCancel}>{tr("ui.cancel")}</Button><Button primary type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={16}/> : <ArrowRight size={17}/>}{tr("ui.startMarking")}</Button></div></div></form></main>;
}
function SettingsPage({settings,dataDir,onSaved,notify,onRestored}:{settings:Settings;dataDir:string;onSaved:(s:Settings)=>void;notify:(s:string,e?:boolean)=>void;onRestored:()=>Promise<void>}){
 const [s,setS]=useState<Settings>(settings),[busy,setBusy]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setBusy('settings');try{onSaved(await api('settings','PUT',{studio:s.studio||'',unit:s.unit||'cm',header:s.header||''}));}catch(e){notify((e as Error).message,true);}finally{setBusy('');}}
 return <main className="page-content settings-page"><div className="page-heading"><div><div className="eyebrow">YOUR ATELIER</div><h1>{tr('ui.studioSettings')}</h1><p>{tr('ui.putYourStudioSProfessionalTouchOnEvery')}</p></div></div>
 <section className="form-card language-settings"><h2>{tr('ui.interfaceLanguage')}</h2><p>{tr('ui.languageChangesTheInterfaceAndPdfLabelsCustomer')}</p><LanguageSwitch onChanged={()=>{}}/></section>
 <form onSubmit={save} className="form-card"><div className="card-title"><span><Shirt size={20}/></span><div><h2>{tr('ui.studioDetails')}</h2><p>{tr('ui.shownInTheWorkspaceAndExportedPdfs')}</p></div></div><div className="form-grid"><Field label={tr('ui.studioName')}><input maxLength={200} placeholder={tr('ui.eGTheFittingAtelier')} value={s.studio||''} onChange={e=>setS({...s,studio:e.target.value})}/></Field><Field label={tr('ui.defaultUnit')}><select value={s.unit||'cm'} onChange={e=>setS({...s,unit:e.target.value})}><option value="cm">{tr('ui.centimetresCm')}</option><option value="mm">{tr('ui.millimetresMm')}</option><option value="in">{tr('ui.inchesIn')}</option></select></Field></div><Field label={tr('ui.pdfHeader')}><input maxLength={500} placeholder={tr('ui.eGBespokeTailoringFittingRecord')} value={s.header||''} onChange={e=>setS({...s,header:e.target.value})}/></Field><div className="align-right"><Button primary type="submit" disabled={!!busy}><Save size={16}/>{tr('ui.saveSettings')}</Button></div></form>
 <Backups notify={notify} onRestored={async()=>{await onRestored();const boot=await api('bootstrap');setS(boot.settings);}}/><section className="form-card"><h2>{tr('ui.dataFolderProvidedByToparrow')}</h2><p className="data-directory">{dataDir}</p></section><div className="about-box"><img src="/icon.png" alt=""/><div><h3>{tr('ui.fitnote2')} <span>{tr("ui.applicationVersion")} v{APP_VERSION}</span></h3><p>{tr('ui.fittingAlterationsClearlyMarkedLocalNoCloudService')}</p></div></div></main>;
}

function LanguageSwitch({onChanged}:{onChanged:(locale:'zh-CN'|'en-US')=>void}){
const locale=useLanguage(),[pending,setPending]=useState(false),[error,setError]=useState('');
async function change(value:string){if(value===locale)return;setPending(true);setError('');try{const next=value==='en-US'?'en-US':'zh-CN';const result=await api<Settings>('settings','PUT',{locale:next});if(result.locale!==next)throw Error(tr("ui.languageCouldNotBeSavedReopenTheUpdated"));setLocale(next);onChanged(next);}catch(e){setError(translateMessage((e as Error).message));}finally{setPending(false);}}
return <div className="language-control"><select aria-label={tr("ui.switchLanguage")} value={locale} disabled={pending} onChange={e=>change(e.target.value)}><option value="zh-CN">{tr("locale.zhCN")}</option><option value="en-US">{tr("locale.enUS")}</option></select>{pending&&<Loader2 className="spin" size={13}/ >}{error&&<span role="alert" className="language-error">{error}</span>}</div>;
}
