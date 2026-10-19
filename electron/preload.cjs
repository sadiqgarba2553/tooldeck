const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tooldeck',{
  legacyPreferences:()=>ipcRenderer.invoke('preferences:migrate'),
  chooseMedia:()=>ipcRenderer.invoke('media:choose'),
  processMedia:request=>ipcRenderer.invoke('media:process',request),
  exportMedia:token=>ipcRenderer.invoke('media:export',token),
  cancel:()=>ipcRenderer.invoke('job:cancel'),
  pdf:request=>ipcRenderer.invoke('pdf:process',request),
  onProgress:listener=>{const callback=(_event,value)=>listener(value);ipcRenderer.on('job:progress',callback);return()=>ipcRenderer.removeListener('job:progress',callback);},
});
