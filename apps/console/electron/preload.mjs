// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // BFF 服务地址（生产环境使用 localhost）
  bffUrl: "http://127.0.0.1:3085",
  // 通知主进程窗口已准备好
  ready: () => ipcRenderer.send("renderer-ready"),
  // 监听主进程的消息
  onMessage: (callback) => {
    ipcRenderer.on("main-message", (_event, channel, data) => callback(channel, data));
  },
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
