"use strict";

/**
 * Set the necessary nw.js stuff
 */
var gui = window.require('nw.gui');
var os = require('os');
var fs = require('fs');
var util = require('util');
var __dirname = process.cwd();
var windows = gui.Window.get();
var menu = new gui.Menu();

/**
 * Handle errors/logging
 */
process.on('uncaughtException', function(err) {

    err = err.toString();
    console.log(err);

    if (~err.indexOf("XMLHttpRequest")) {
        clearInterval(timeout);
        timeout = 0;
        enabled.checked = false;
        alert("Error pinging " + url.value + ". Please check the URL/your internet connection and try again.");
    } else {
        alert('A fatal error occured! Check the debug.log.');
    }
});

var log_file = fs.createWriteStream(__dirname + '/debug.log', {
    flags: 'w'
});

var log_stdout = process.stdout;

console.log = function(d) {
    log_file.write(getDateTime() + " - " + util.format(d) + '\n');
    log_stdout.write(getDateTime() + " - " + util.format(d) + '\n');
};

/**
 * Global variales
 */
var xhr;
var timeout;

// Devtools
// gui.Window.get().showDevTools();

// Windows
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
    var author = document.getElementById("author__url");
    var debug = document.getElementById("debug__link");

    close.onclick = function() {
        windows.hide();
    };

    author.onclick = function() {
        gui.Shell.openExternal('https://kingsleyraspe.co.uk');
    };

    debug.onclick = function() {
        alert("Attempting to open log. If it doesn't open, navigate to " + __dirname + "/debug.log");
        gui.Shell.openItem('./debug.log');
    }

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
        timeout = setInterval(function() {
            xhr.open('GET', url.value, false);
            xhr.send();
            updateHeartbeat();
        }, interval.value * 60000);

        return true;
    }
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

    clearInterval(timeout);
    timeout = 0;

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

/**
 * Update last ping timestamp
 * @return void
 */
function updateHeartbeat() {
    document.getElementById("heartbeat__value").innerHTML = getDateTime();
};

/**
 * Get date time
 * @return string
 */
function getDateTime() {
    var now = new Date();
    return [
        [AddZero(now.getDate()), AddZero(now.getMonth() + 1), now.getFullYear()].join("/"), [AddZero(now.getHours()), AddZero(now.getMinutes())].join(":"), now.getHours() >= 12 ? "PM" : "AM"
    ].join(" ");
}

/**
 * Add a 0 for single-digit date/time values
 * @param int
 * @return string
 */
function AddZero(num) {
    return (num >= 0 && num < 10) ? "0" + num : num + "";
}