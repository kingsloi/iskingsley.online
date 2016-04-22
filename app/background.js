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
	}

});
mb.on('after-show', function() {
	console.log(mb.window.webContents.send('ping', 'whoooooooh!'));
});