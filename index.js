"use strict";

/**
 * Set the necessary nw.js stuff
 */
var gui = require('nw.gui');
gui.Window.get().showDevTools();
var windows = gui.Window.get();
var menu = new gui.Menu();

var xhr;
var timeout;

// Windows
windows.setResizable(false);
windows.hide();

// Tray icon
var tray = new gui.Tray({
    icon: 'img/icon.png'
});

// Menu
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
        timeout = setInterval(pingUrl, interval.value * 1000);
        return;
    }

    clearInterval(timeout);
    timeout = 0;
}

/**
 * Perform ping
 * @return void
 */
function pingUrl() {
    xhr.open('GET', url.value, false);
    xhr.send();
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