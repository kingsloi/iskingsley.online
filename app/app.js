'use strict';

import os from 'os';
import request from 'superagent';
import { remote, ipcRenderer } from 'electron';
import jetpack from 'fs-jetpack';
import env from './env';

import validator from 'validator';
import animateCss from 'animate.css-js';
import stopwatch from 'timer-stopwatch';
import moment from 'moment';

import './helpers/context_menu';

let app = remote.app;
let ipc = ipcRenderer;
let shell = remote.shell;
let appDir = jetpack.cwd(app.getAppPath());

/*
let shortcut = remote.require('global-shortcut');
shortcut.register('ctrl+alt+s', function () {
    alert('here');
});
*/

let cprTimer;
const messages = {
    errors: {
        general: "Ooops! There was a problem with the URL you've supplied. Please check it and try again",
        badRequest: "Heartbeat refused by the server. Incorrect password maybe?"
    }
}

class App {

    constructor() {

        this.heartbeatErrorCount = 0;
        this.flatlineErrorCount; // = 0;

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
        this.lastHeartbeat = document.getElementById('last-heartbeat');


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
     * setSetting() Set setting stored
     * in local storage
     *
     * @param  {String} key   element ID
     * @param  {String} value stored value
     * @return void
     */
    static setSetting(key, value) {
        localStorage.setItem(key, value);
    }

    /**
     * getSetting() Get item from
     * settings in localstorage
     *
     * @param  {String} key Key stored in localstorage
     * @return {Mixed}      Value from localstorage
     */
    static getSetting(key) {
        return localStorage.getItem(key);
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

        App.setSetting('url', url.value);
        App.setSetting('interval', interval.value);
        App.setSetting('send-heartbeat', heartbeat.checked);
        this.showModel('success');

        // If heartbeat isn't enabled, staph
        if (heartbeat.checked === false) return false;

        this.performCPR();
    }

    /**
     * performCPR() Send a heartbeat
     * every x seconds
     *
     * @return void
     */
    performCPR() {

        cprTimer = new stopwatch(1000);
        cprTimer.start();
        cprTimer.onDone(() => {
            this.sendHeartbeat();
        });
    }

    /**
     * sendHeartbeat() Ping the server
     *
     * @return {Boolean} whether success or not
     */
    sendHeartbeat() {

        let badRequest = false,
            url = App.getSetting('url'),
            interval = App.getSetting('interval'),
            isCPREnabled = App.getSetting('send-heartbeat');

        request.get(url)
            .query({
                interval: interval
            }).end((error, response) => {
                // If no errors & json returned from the server
                if (response.type === "application/json" && !error) {

                    // Parse response from server
                    let body = App.tryParseJSON(response.text);

                    // If succcessful
                    if (response.status === 200 && body.success === true) {

                        // Reset errors, update heartbeat
                        this.heartbeatErrorCount = 0;
                        this.updateLastHeartbeat(body.expires_on);

                        // Perform another heartbeat
                        if (isCPREnabled == "true") {
                            cprTimer.stop();
                            this.performCPR();
                        }

                        // If successful, no need to go any further
                        return true;
                    } else {
                        badRequest = true;
                    }
                }

                this.heartbeatErrorCount++;
                if (this.heartbeatErrorCount > 2) {
                    alert((!badRequest) ? messages.errors.badRequest : messages.errors.general);
                    this.stopCPR();
                }
            })
    }

    get heartbeatErrorCount() {
        return this._heartbeatErrorCount;
    }

    set heartbeatErrorCount(val) {
        this._heartbeatErrorCount = val;
    }

    stopCPR() {
        this.heartbeatCheckbox.checked = false;
        cprTimer.stop();
    }

    /**
     * updateLastHeartbeat() Update last ping on UI
     *
     * @param  {String} expires_on when heartbeat expires on the server
     * @return void
     */
    updateLastHeartbeat(expires_on) {

        let nowHR = moment().format("DD/MM/YY hh:mm A"),
            expiresHR = moment(expires_on).format('DD/MM/YY hh:mm A');

        this.lastHeartbeat.innerHTML = nowHR;
        this.lastHeartbeat.title = 'Expires on: ' + expiresHR;
        App.setSetting('last-heartbeat', nowHR);
        App.setSetting('last-heartbeat-expiry', expiresHR);
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
            if (element.type == "checkbox") {
                element.checked = (value == 'true');
            } else if (element.type == "text") {
                element.value = value;
            } else {
                element.innerHTML = value;
            }
        }

        if (key == 'last-heartbeat-expiry') {
            this.lastHeartbeat.title = "Expires on: " + value;
        }
    }

    /**
     * hideModel() Hide the model
     * and remove the success/error classes
     *
     * @return void
     */
    hideModel() {
        this.model.classList.remove('model--is-failure');
        this.model.classList.remove('model--is-success');
        this.model.classList.remove('model--is-disconnected');
    }

    /**
     * showModel() Show model
     *
     * @param  {String} type type of model to show
     * @return void
     */
    showModel(type) {
        this.hideModel();
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
     * tryParseJSON() Try parse json
     *
     * @param  {String} json        json string to validate
     * @return {String} | {Boolean}
     */
    static tryParseJSON(json) {
        try {
            let o = JSON.parse(json);
            if (o && typeof o === "object" && o !== null) {
                return o;
            }
        } catch (e) {
            console.log(e);
        }
        return false;
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