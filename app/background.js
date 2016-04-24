import {
	app,
	Menu,
	Tray,
	ipcMain as ipc
} from 'electron';
import createMenubar from './helpers/window';
import env from './env';
import path from 'path';

/**
 * Create menu bar
 * @type Object
 */
var menubar = createMenubar({
	'index': 'file://' + __dirname + '/app.html',
	'tooltip': 'Are You Online?',
	'width': 350,
	'height': 300,
	'transparent': false
});

/**
 * After creating the menubar window
 * @return void
 */
menubar.on('after-create-window', function () {
	if (env.name !== 'production') {
		menubar.window.openDevTools();
	} else {
		menubar.window.setResizable(false);
	}

	// If heartbeat hasn't expired, show offline button?
	menubar.window.webContents.send('OnCreateOrShowEvents');
});

/**
 * After window has been shown
 * @return void
 */
menubar.on('after-show', function () {
	// If heartbeat hasn't expired, show offline button?
	menubar.window.webContents.send('OnCreateOrShowEvents');
});