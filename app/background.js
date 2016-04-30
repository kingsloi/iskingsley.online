// Global
import { app, Menu, Tray, ipcMain as ipc } from "electron";
import createMenubar from "./helpers/window";
import env from "./env";
import path from "path";

/**
 * Create menu bar
 *
 * @type {Object}
 */
let menubar = createMenubar({
    index: `file://${__dirname}/app.html`,
    tooltip: "Are You Online?",
    width: 350,
    height: 240,
    transparent: false,
    preloadWindow: true
});

/**
 * After creating the menubar window
 *
 * @return void
 */
menubar.on("after-create-window", () => {
    if (env.name !== "production") {
        menubar.window.openDevTools();
    } else {
        menubar.window.setResizable(false);
    }

    // If heartbeat hasn"t expired, show offline button?
    menubar.window.webContents.send("OnCreateOrShowEvents");
});

/**
 * After window has been shown
 *
 * @return void
 */
// If heartbeat hasn"t expired, show offline button?
menubar.on("after-show", () =>
    menubar.window.webContents.send("OnCreateOrShowEvents")
);

/**
 * Exit application
 *
 * @return void
 */
ipc.on("exit", () => menubar.app.quit());

/**
 * Exceptions
 *
 * void
 */
process.on("uncaughtException", err => {
    alert(`Uncaught Exception: ${err.message}`, err.stack || "");
    mb.app.quit();
});