export interface IElectronAPI {
  appVersion: () => Promise<void>
  routeChanged: (query: string) => Promise<void>
  onUpdateAvailable: (callback: void) => Promise<void>
  onUpdateDownloaded: (callback: void) => Promise<void>
  restartApp: () => Promise<void>
}
  
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}