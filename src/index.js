"use strict";

/**
 * Set the necessary nw.js stuff
 */
var gui = require('nw.gui');
var os = require('os');
var fs = require('fs');
var util = require('util');

var __dirname = process.cwd();

/**
 * Handle errors/logging
 */
process.on('uncaughtException', function(err) {
    console.log(err);
    alert('Fatal Error! Check debug log for details.');
});

var log_file = fs.createWriteStream(__dirname + '/debug.log', {
    flags: 'w'
});

var log_stdout = process.stdout;

console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

/**
 * Global variales
 */
var xhr;
var timeout;

// Devtools
// gui.Window.get().showDevTools();

// Windows
var windows = gui.Window.get();
var menu = new gui.Menu();
windows.setResizable(false);
windows.hide();

// Tray icon
var tray = new gui.Tray({
    icon: 'img/icon.png'
});

// Workaround for copy-paste working on Mac.
if (os.platform() == "darwin") {
    var nativeMenuBar = new gui.Menu({
        type: "menubar"
    });
    nativeMenuBar.createMacBuiltin("Are You Online?");
    windows.menu = nativeMenuBar;
}

// Tray Menu
menu.append(new gui.MenuItem({
    label: 'Settings',
    click: function() {
        windows.show();
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

/**
 * Init all the things
 * @return void
 */
function init() {

    var url = document.getElementById("url");
    var interval = document.getElementById("interval");
    var enabled = document.getElementById("enabled");
    var close = document.getElementById("close");

    close.onclick = function() {
        windows.hide();
    };

    getSettings();

    ping();
}

/**
 * Ping given URL at the given interval
 * @return void
 */
function ping() {

    if (enabled.checked) {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    alert('XHR Error. Please check the URL and/or your internet connection').
                    return;
                }
            }
        }

        timeout = setInterval(function() {
            xhr.open('GET', url.value, false);
            xhr.send();
        }, interval.value * 10000);
        return;
    }

    clearInterval(timeout);
    timeout = 0;
}

/**
 * Get settings from localstorage
 * @return void
 */
function getSettings() {
    if (localStorage.getItem('is_online--url')) {
        url.value = localStorage.getItem('is_online--url');
    }
    if (localStorage.getItem('is_online--interval')) {
        interval.value = localStorage.getItem('is_online--interval');
    }
    if (localStorage.getItem('is_online--enabled')) {
        if (localStorage.getItem('is_online--enabled') == "true") {
            enabled.checked = true;
        }
    }
}

/**
 * Set settings to localstorage
 * @return void
 */
function setSettings() {
    localStorage.setItem('is_online--url', url.value);
    localStorage.setItem('is_online--interval', interval.value);
    localStorage.setItem('is_online--enabled', enabled.checked);
    alert('Settings saved');
}

/**
 * Save settings
 * @return void
 */
function saveSettings() {

    var error = false;

    if (enabled.checked) {

        // Validate URL
        if (!url.value.match(/\S/)) {
            url.parentNode.classList.add('has-error');
            error = true;
        } else {
            url.parentNode.classList.remove('has-error');
        }

        // Validate Interval
        if (!interval.value.match(/\S/)) {
            interval.parentNode.classList.add('has-error');
            error = true;
        } else {
            interval.parentNode.classList.remove('has-error');
        }
    } else {

        // Remove all errors
        url.parentNode.classList.remove('has-error');
        interval.parentNode.classList.remove('has-error');
    }

    if (!error) {
        setSettings();
        ping();
    }
}