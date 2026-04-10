const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('velma', {
  getState:    ()      => ipcRenderer.invoke('get-velma-state'),
  pet:         ()      => ipcRenderer.invoke('pet-velma'),
  getPanelData:()      => ipcRenderer.invoke('get-panel-data'),
  openPanel:   ()      => ipcRenderer.send('open-panel'),
  closePanel:  ()      => ipcRenderer.send('close-panel'),
  moveCompanion:(x, y) => ipcRenderer.send('move-companion', { x, y }),
});
