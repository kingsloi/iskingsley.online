'use strict';

import os from 'os';
import request from 'superagent';
import { remote, ipcRenderer } from 'electron';
import jetpack from 'fs-jetpack';
import env from './env';
import validator from 'validator';

let app = remote.app;
let ipc = ipcRenderer;
let shell = remote.shell;
let appDir = jetpack.cwd(app.getAppPath());

class App {

    constructor() {

        // Shortcut to DOM elements
        this.appContainer = document.getElementById('app');
        this.settingsForm = document.getElementById('settings');
        this.urlInput = document.getElementById('url');
        this.intervalInput = document.getElementById('interval');
        this.heartbeatCheckbox = document.getElementById('send-heartbeat');
        this.saveButton = document.getElementById('save');
        this.offlineButton = document.getElementById('go-offline');

        // Disable form submit
        this.settingsForm.addEventListener('submit', (e) => this.submitForm(e));

        // Save settings on button click
        this.saveButton.addEventListener('click', () => this.saveSettings());

        // Go offline on button click
        this.offlineButton.addEventListener('click', () => this.goOffline());

        // Validate interval input
        this.intervalInput.addEventListener('keydown', (e) => this.validateInterval(e));

        // Load previously saved settings
        for (let key in localStorage) {
            this.getSettings(key, localStorage[key]);
        }

        // Listen for updates to settings from other windows
        window.addEventListener('storage', e => this.displayNote(e.key, e.newValue));
        //element.addEventListener("webkitAnimationEnd", showMessage, false);
        //element.addEventListener("oAnimationEnd"     , showMessage, false);
        //element.addEventListener("msAnimationEnd"    , showMessage, false);
        //element.addEventListener("animationend"      , showMessage, false);
    }

    /**
     * submitForm() On form submit
     * prevent submit/refresh
     *
     * @param  {Event} e Form submit event
     * @return void
     */
    submitForm(e) {
        e.preventDefault();
    }

    /**
     * saveSettings() Save/persist
     * the form settings
     *
     * @return void
     */
    saveSettings() {
        if (this.validateInput()) {

            this.setSetting('url', this.urlInput.value);
            this.setSetting('interval', this.intervalInput.value);
            this.setSetting('send-heartbeat', this.heartbeatCheckbox.checked);
        }
    }

    /**
     * validateInterval() Don't allow
     * non-numberic characters from input
     *
     * @param  {Event} e Keydown event
     * @return void
     */
    validateInterval(e) {
        let unicode = e.charCode ? e.charCode : e.keyCode;
        if (unicode != 8) {
            if (unicode < 48 || unicode > 57)
                e.preventDefault();
        }
    }

    /**
     * validateInput() Validate input fields
     * for save
     *
     * @return {Boolean} whether or not input was valid
     */
    validateInput() {
        // Remove any existing errors
        this.urlInput.parentElement.classList.remove("has-error");
        this.intervalInput.parentElement.classList.remove("has-error");

        // Validate input
        let urlOpts = { require_protocol: true },
            url = !validator.isNull(this.urlInput.value) && validator.isURL(this.urlInput.value, urlOpts),
            interval = validator.isNumeric(this.intervalInput.value);

        // If not valid, add error classes
        if (!url) this.urlInput.parentElement.classList.add("has-error");
        if (!interval) this.intervalInput.parentElement.classList.add("has-error");

        return url && interval;
    }

    /**
     * setSetting() Set setting stored
     * in local storage
     *
     * @param  {String} key   element ID
     * @param  {String} value stored value
     * @return void
     */
    setSetting(key, value) {
        localStorage.setItem(key, value);
    }

    /**
     * getSettings() Apply setting stored
     * in local storage
     *
     * @param  {String} key   element ID
     * @param  {String} value stored value
     * @return void
     */
    getSettings(key, value) {
        let element = document.getElementById(key);
        if (element) {
            if (element.type === "checkbox") {
                element.checked = (value == 'true');
            } else {
                element.value = value;
            }
        }
    }

    init() {
        console.log('this.settings');
    }
};

// On load start the app
window.addEventListener('load', () => new App());