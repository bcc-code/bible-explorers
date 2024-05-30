import { app, protocol, shell, dialog, BrowserWindow, net, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { autoUpdater } from "electron-updater";
import log from 'electron-log/main';
import ElectronStore from "electron-store";

const PRODUCTION_APP_PROTOCOL = "biex";
const PRODUCTION_APP_PATH = path.join(__dirname);
const defaultUrl = `${PRODUCTION_APP_PROTOCOL}://explorers.biblekids.io`;
let initUrl = defaultUrl;
let appReadyHasRun = false;
const store = new ElectronStore();

let window: BrowserWindow | undefined;
const openWindow = (url: string) => {
  if (!appReadyHasRun) {
    initUrl = url;
    return;
  }

  window = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default",
    icon: 'static/favicon.png',
  });

  // window.webContents.openDevTools()

  const bounds = store.get("bounds");
  // restoring settings works fine on Mac. Maybe other environments need additional code to deal with changing monitor setups. See https://github.com/electron/electron/issues/526
  if (bounds) window.setBounds(bounds);

  window.webContents.setWindowOpenHandler(({ url }) => {
    handleUrl(url);
    return { action: 'deny' };
  });

  async function handleUrl(url: string) {
    const parsedUrl = maybeParseUrl(url);
    if (!parsedUrl) {
      return;
    }

    const { protocol } = parsedUrl;

    if (protocol !== PRODUCTION_APP_PROTOCOL) {
      // Open the URL in the default browser
      try {
        await shell.openExternal(url);
      } catch (error: unknown) {
        log.error(`Failed to open url: ${error}`);
      }
    }
  }

  function maybeParseUrl(value: string): URL | undefined {
    if (typeof value === 'string') {
      try {
        return new URL(value);
      } catch (err) {
        // Errors are ignored, as we only want to check if the value is a valid url
        log.error(`Failed to parse url: ${value}`);
      }
    }

    return undefined;
  }

  window.webContents.on("will-navigate", (e, _url) => {
    // Some links from the API have the fixed domain `explorers.biblekids.io` on the `http(s)` protocol. Use our router instead of navigating (which means reloading the "app").
    if (/^https?:\/\/explorers\.biblekids\.io\//.test(_url)) {
      e.preventDefault();
      navigateToUri(window!, removeUrlOrigin(_url));
      return;
    }

    // Introduced to handle login-process in the default browser. A user usually has his login credentials already saved there.
    if (!_url.startsWith(`${PRODUCTION_APP_PROTOCOL}://`)) {
      e.preventDefault();
      shell.openExternal(_url).catch((error) => {
        dialog.showErrorBox(_url, `${error}`);
      });
    }
  });

  window.loadURL(url).catch((error) => {
    dialog.showErrorBox(url, `${error}`);
  });

  window.on("close", () => {
    store.set("bounds", window?.getBounds());
  });
  window.on("closed", () => {
    window = undefined;
  });
};

const navigateToUri = (window: BrowserWindow, url: string) => {
  window.webContents.send("route-changed", url);
};

const removeUrlOrigin = (_url: string) => {
  const url = new URL(
    /^https?:\/\//.test(_url)
      ? _url
      : `http${_url.substring(_url.indexOf("://"))}`,
  );

  return url.href.substring(url.origin.length);
};

// Limit the app to a single instance and pass on arguments to the second instance (calls the "second-instance" event)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  const [, ...args] = [...process.argv];

  if (process.defaultApp) {
    if (args.length >= 1) {
      app.setAsDefaultProtocolClient(
        PRODUCTION_APP_PROTOCOL,
        process.execPath,
        [path.resolve(args.shift()!)],
      );
    }
  } else {
    app.setAsDefaultProtocolClient(PRODUCTION_APP_PROTOCOL);
  }

  // Expect the next parameter to be a URL
  if (args.length >= 1 && /^biex:\/\//.test(args[0]!)) {
    openWindow(args.shift()!);
  }

  protocol.registerSchemesAsPrivileged([
    {
      scheme: PRODUCTION_APP_PROTOCOL,
      privileges: { secure: true, standard: true, supportFetchAPI: true },
    },
  ]);

  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(() => {
    if (process.env.VITE_DEV_SERVER_URL) {
      protocol.registerStreamProtocol(
        PRODUCTION_APP_PROTOCOL,
        (request, callback) => {
          net
            .request({
              method: request.method,
              url: `${process.env.VITE_DEV_SERVER_URL}${removeUrlOrigin(
                request.url,
              )}`,
            })
            .on("response", (response) => {
              callback(response);
            })
            .end();
        },
      );
    } else {
      protocol.registerFileProtocol(
        PRODUCTION_APP_PROTOCOL,
        (request, callback) => {
          const relativePath = path.normalize(new URL(request.url).pathname);
          const absolutePath = path.join(
            PRODUCTION_APP_PATH,
            relativePath !== path.sep ? relativePath : "index.html",
          );

          // Can the file be accessed? If yes, serve it. If not, it's most likely a route which we should resolve by opening index.html.
          fs.access(absolutePath)
            .then(() => fs.lstat(absolutePath))
            .then((stat) => {
              if (stat.isFile()) {
                // eslint-disable-next-line n/no-callback-literal
                callback({ path: absolutePath });
              } else {
                // eslint-disable-next-line no-throw-literal, @typescript-eslint/no-throw-literal
                throw undefined;
              }
            })
            .catch(() => {
              // eslint-disable-next-line n/no-callback-literal
              callback({ path: path.join(PRODUCTION_APP_PATH, "index.html") });
            });
        },
      );
    }

    appReadyHasRun = true;
    openWindow(initUrl);

    // autoUpdater.forceDevUpdateConfig = true
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://static2.bcc.media/explorers/',
      channel: 'latest',
    })
    autoUpdater.checkForUpdatesAndNotify();
  });

  // Event is triggered when another program opens a `biex://` link.
  app.on("open-url", (_, url) => {
    if (!window) {
      openWindow(url);
    } else if (/^biex:\/\//.test(url)) {
      navigateToUri(window, removeUrlOrigin(url));
    } else {
      window.loadURL(url);
    }
  });

  app.on("second-instance", (_, commandLine) => {
    // What else would be the first argument ..?
    const url = commandLine.pop() || "";

    // Someone tried to run a second instance, we should focus our window.
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }

      window.focus();

      if (/^biex:\/\//.test(url)) {
        navigateToUri(window, removeUrlOrigin(url));
      } else {
        window.loadURL(url);
      }
    } else {
      openWindow(url);
    }
  });

  // Inter-Process Communication - Event listeners

  ipcMain.on('app-version', (event) => {
    event.sender.send('app-version', { version: app.getVersion() })
  })

  autoUpdater.on('update-available', () => {
    window.webContents.send('update-available')
  })

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update-downloaded')
  })

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  // On MacOS, if the icon in the dock is tapped ...
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openWindow(defaultUrl);
    }
  });
}
