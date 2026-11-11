const {app,shell}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const folder=process.argv[2];
if(!folder||!path.isAbsolute(folder)||!fs.statSync(folder).isDirectory())process.exit(1);
const dataRoot=path.dirname(folder),cache=path.join(dataRoot,'desktop-cache');
fs.mkdirSync(path.join(cache,'crashes'),{recursive:true});
app.setPath('userData',cache);app.setPath('sessionData',cache);app.setPath('crashDumps',path.join(cache,'crashes'));app.setAppLogsPath(path.join(dataRoot,'logs'));
app.whenReady().then(async()=>{if(app.dock)app.dock.hide();const error=await shell.openPath(folder);if(error){console.error(error);app.exit(1);}else app.quit();}).catch(()=>app.exit(1));
