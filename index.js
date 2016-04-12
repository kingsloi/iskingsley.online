"use strict";

// (function() {
//     var xhr = new XMLHttpRequest();
//     var timeout = this.window.setInterval(function() {
//         xhr.open('GET', 'http://iskingsley.online?password=password', false);
//         xhr.send();
//     }, 5000);
// }).call(this);

// GUI
var gui = require('nw.gui');

// Disable window
var win = gui.Window.get();
win.setResizable(false);
win.hide();

// Tray icon
var tray = new gui.Tray({
    icon: 'img/icon.png'
});

// Build the menu
var menu = new gui.Menu();



menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Enable',
    click: function() {
        win.show();
    }
}));

menu.append(new gui.MenuItem({
    type: 'separator'
}));


menu.append(new gui.MenuItem({
    label: 'Quit',
    click: function() {
        gui.App.quit();
    }
}));



tray.menu = menu;