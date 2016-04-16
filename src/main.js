var menubar = require('menubar');
var ipc = require("electron").ipcMain;
var opts = {
	// "width": 300,
	// "height": 375
};

var mb = menubar(opts);

mb.on('after-show', function() {
	console.log(' 1231');
	// console.log(ipc.app.BrowserWindow);

})

mb.on('after-create-window', function() {
	mb.window.openDevTools()
});