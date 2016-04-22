import {
	app,
	Menu,
	Tray,
	ipcMain as ipc
} from 'electron';
import createWindow from './helpers/window';
import env from './env';
import path from 'path';

var mb = createWindow();

mb.on('after-create-window', function() {
	if (env.name !== 'production') {
		mb.window.openDevTools();
	} else {
		mb.window.setResizable(false);
	}

	mb.window.webContents.send('toggleGoOfflineButton');

	mb.window.webContents.on('will-navigate', function(ev) {
		ev.preventDefault()
	});

});

mb.on('after-show', function() {
	mb.window.webContents.send('toggleGoOfflineButton');
});

will - navigate