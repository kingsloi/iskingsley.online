'use strict';

import os from 'os';
import request from 'superagent';
import { remote, ipcRenderer } from 'electron';
import jetpack from 'fs-jetpack';
import env from './env';
import validator from 'validator';
import animateCss from 'animate.css-js';

import './helpers/context_menu';

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
        this.resetButton = document.getElementById('reset-settings');
        this.offlineButton = document.getElementById('go-offline');
        this.model = document.getElementById('model');

        // Event Listeners
        this.settingsForm.addEventListener('submit', (e) => this.submitForm(e));
        this.saveButton.addEventListener('click', () => this.saveSettings());
        this.offlineButton.addEventListener('click', () => this.goOffline());
        this.resetButton.addEventListener('click', () => this.resetSettings());
        this.intervalInput.addEventListener('keydown', (e) => this.validateInterval(e));

        // Load previously saved settings
        for (let key in localStorage) {
            this.getSettings(key, localStorage[key]);
        }
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
        if (!this.validateInput()) {
            this.showModel('failure');
            return false;
        }

        let url = this.urlInput;
        let interval = this.intervalInput;
        let heartbeat = this.heartbeatCheckbox;

        this.setSetting('url', url.value);
        this.setSetting('interval', interval.value);
        this.setSetting('send-heartbeat', heartbeat.checked);

        // If heartbeat isn't enabled, staph
        if (heartbeat.checked === false) return false;

        this.showModel('success');

    }

    /**
     * resetSettings() reset settings/application
     * from scratch
     *
     * @return void
     */
    resetSettings() {
        localStorage.clear();
        location.reload();
    }

    /**
     * validateInterval() Don't allow
     * non-numberic characters from input
     *
     * @param  {Event} e Keydown event
     * @return void
     */
    validateInterval(e) {
        let character = e.charCode ? e.charCode : e.keyCode;
        if (character !== 8) {
            if (character < 48 || character > 57) {
                e.preventDefault();
            }
        }
    }

    /**
     * validateInput() Validate input fields
     * for save
     *
     * @return {Boolean} whether or not input was valid
     */
    validateInput() {

        let url = this.urlInput;
        let interval = this.intervalInput;
        let heartbeat = this.heartbeatCheckbox;

        if (heartbeat.checked === false) return true;

        let urlOpts = { require_protocol: true };

        // Remove any other errors
        url.parentElement.classList.remove("has-error");
        interval.parentElement.classList.remove("has-error");

        // Trim whitespace
        url.value = url.value.trim();
        interval.value = interval.value.trim();

        // Validate all the things
        let isURLValid = !validator.isNull(url.value) && validator.isURL(url.value, urlOpts);
        let isIntervalValid = validator.isNumeric(interval.value);

        // If not valid, add error classes
        if (!isURLValid) url.parentElement.classList.add("has-error");
        if (!isIntervalValid) interval.parentElement.classList.add("has-error");

        return isURLValid && isIntervalValid;
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

    /**
     * showModel() Show model
     *
     * @param  {String} type type of model to show
     * @return void
     */
    showModel(type) {
        switch (type) {
        case 'success':
            this.model.classList.add('model--is-success');
            this.animate('fadeinout');
            break;
        case 'failure':
            this.model.classList.add('model--is-failure');
            this.animate('fadeinout');
            break;
        case 'disconnected':
            this.model.classList.add('model--is-disconnected');
            break;
        }
    }

    /**
     * animate() Using animate.css
     *
     * @param  {String} animationType Animateion CSS class to use
     * @return void
     */
    animate(animationType) {
        animateCss.animate(this.model, {
            animationName: animationType,
            duration: 500,
            callbacks: [
                function () {
                    // maybe?
                }
            ]
        });
    }
};

// On load start the app
window.addEventListener('load', () => new App());