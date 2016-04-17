var menubar = require('menubar');


var opts = {
	// "width": 300,
	// "height": 375
};

var mb = menubar(opts);


var ipc = require('electron').ipcMain;
// /var ipc = require('ipc');

ipc.on('invokeAction', function(event, data) {
	var result = processData(data);
	event.sender.send('actionReply', result);
});

// ipc.on('close-main-window', function() {
// 	console.log(mb.window.closeDevTools());
// });



mb.on('after-show', function() {
	//ipc.send('some-server-message', 'bar');
})

mb.on('after-create-window', function() {
	mb.window.openDevTools()
});