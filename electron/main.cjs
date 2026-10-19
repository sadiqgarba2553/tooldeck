const {app,BrowserWindow,Menu,session,protocol,net,ipcMain}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');const {registerNative}=require('./native.cjs');
const {legacyPreferences}=require('./preferences.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'tooldeck',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
app.setAppUserModelId('com.bluecloud.tooldeck');
if(app.commandLine.hasSwitch('user-data-dir'))app.setPath('userData',path.resolve(app.commandLine.getSwitchValue('user-data-dir')));
const start='tooldeck://app/index.html',root=path.resolve(__dirname,'../dist');
if(!app.requestSingleInstanceLock())app.quit();else app.whenReady().then(async()=>{
  protocol.handle('tooldeck',request=>{const url=new URL(request.url);let relative;try{relative=decodeURIComponent(url.pathname).replace(/^\//,'');}catch{return new Response('Invalid path',{status:400});}const target=path.resolve(root,relative);if(url.hostname!=='app'||!target.startsWith(root+path.sep)||relative.includes('\\')||relative.includes(':'))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(target).href);});
  const win=new BrowserWindow({width:1380,height:920,minWidth:780,minHeight:600,backgroundColor:'#fafafa',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_wc,permission,done)=>done(permission==='clipboard-sanitized-write'));
  session.defaultSession.webRequest.onBeforeRequest((details,done)=>done({cancel:!['tooldeck:','blob:','data:','file:','devtools:'].some(s=>details.url.startsWith(s))}));
  session.defaultSession.webRequest.onHeadersReceived((details,done)=>done({responseHeaders:{...details.responseHeaders,'Content-Security-Policy':["default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'none'; frame-src 'none'"]}}));
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,url)=>{if(url.split('#')[0]!==start)event.preventDefault();});win.webContents.on('will-attach-webview',event=>event.preventDefault());
  const authorize=event=>{if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||event.senderFrame.url.split('#')[0]!==start)throw Error('Untrusted window');};
  registerNative(win,authorize);let saved={};try{saved=await legacyPreferences();}catch{}ipcMain.handle('preferences:migrate',event=>{authorize(event);return saved;});
  win.loadURL(start);app.on('second-instance',()=>{if(win.isMinimized())win.restore();win.focus();});
});app.on('window-all-closed',()=>app.quit());
