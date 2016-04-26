'use strict';

// Core
import os from 'os';
import { remote, ipcRenderer } from 'electron';
import jetpack from 'fs-jetpack';
import env from './env';

// Plugins
import request from 'superagent';
import validator from 'validator';
import animateCss from 'animate.css-js';
import stopwatch from 'timer-stopwatch';
import moment from 'moment';

// Helpers
import './helpers/context_menu';

// Global variables
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

const DATETIME_FORMAT = 'DD/MM/YY hh:mm A';
const messages = {
    errors: {
        general: "Ooops! There was a problem with the URL you've supplied. Please check it and try again",
        badRequest: "Heartbeat refused by the server. Incorrect password maybe?"
    },
    confirm: {
        reset: "Are you sure you want to reset the application?"
    }
}

class App {

    constructor() {

        this.flatline = false;
        this.heartbeatErrorCount = 0;
        this.flatlineErrorCount = 0;

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
        this.resetButton.addEventListener('click', () => App.resetSettings());
        this.intervalInput.addEventListener('keydown', (e) => this.validateInterval(e));

        // Load previously saved settings
        for (let key in localStorage) {
            this.getSettings(key, localStorage[key]);
        }

        // Toggle ofline button / register main.js events
        this.toggleGoOfflineButton();
        this.registerIpcEvents();
    }

    /**
     * registerIpcEvents() Register render process events
     * called from main js
     *
     * @todo improve maybe but not sure how :(
     * @return void
     */
    registerIpcEvents() {
        ipc.on('OnCreateOrShowEvents', () => {
            this.toggleGoOfflineButton();
        });
    }

    /**
     * resetSettings() reset settings/application
     * from scratch
     *
     * @return void
     */
    static resetSettings() {
        let sure = confirm(messages.confirm.reset);
        if (sure) {
            localStorage.clear();
            location.reload();
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
     * get flatline() fetch heartbeat
     * ajax errors
     *
     * @return {Number} number of heartbeat errors
     */
    get flatline() {
        return this._flatline;
    }

    /**
     * set flatline() set flatline
     * ajax error count
     *
     * @param  {Number} val flatline error count
     * @return void
     */
    set flatline(val) {
        this._flatline = val;
    }

    /**
     * get heartbeatErrorCount() fetch heartbeat
     * ajax errors
     *
     * @return {Number} number of heartbeat errors
     */
    get heartbeatErrorCount() {
        return this._heartbeatErrorCount;
    }

    /**
     * set flatlineErrorCount() set flatline
     * ajax error count
     *
     * @param  {Number} val flatline error count
     * @return void
     */
    set flatlineErrorCount(val) {
        this._flatlineErrorCount = val;
    }

    /**
     * get flatlineErrorCount() fetch flatline
     * ajax errors
     *
     * @return {Number} number of flatline errors
     */
    get flatlineErrorCount() {
        return this._flatlineErrorCount;
    }

    /**
     * set heartbeatErrorCount() set heartbeat
     * ajax error count
     *
     * @param  {Number} val heartbeat error count
     * @return void
     */
    set heartbeatErrorCount(val) {
        this._heartbeatErrorCount = val;
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

        if (typeof cprTimer == "object") cprTimer.stop();

        // If heartbeat isn't enabled, staph
        if (heartbeat.checked === false) {
            return false;
        }

        this.sendHeartbeat();
        this.toggleGoOfflineButton();
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
                if (response.type === "application/json" && !error) {
                    let body = App.tryParseJSON(response.text);
                    if (response.status === 200 && body.success === true) {
                        this.heartbeatErrorCount = 0;
                        this.updateLastHeartbeat(body.expires_on);
                        this.toggleGoOfflineButton();
                        if (isCPREnabled == "true") {
                            if (typeof cprTimer == "object") cprTimer.stop();
                            this.performCPR();
                        }
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
                return false;
            })
    }

    /**
     * sendHeartbeat() Ping the server
     * with the go offline signal
     *
     * @return {Boolean} whether success or not
     */
    sendFlatline() {

        let badRequest = false,
            url = App.getSetting('url');

        request.get(url)
            .query({
                offline: '1'
            }).end((error, response) => {
                if (response.type === "application/json" && !error) {
                    let body = App.tryParseJSON(response.text);
                    if (response.status === 200 && body.success === true) {
                        this.heartbeatErrorCount = 0;
                        this.flatline = true;
                        this.updateLastHeartbeat(body.expires_on);
                        this.toggleGoOfflineButton();
                        this.stopCPR();
                        return true;
                    } else {
                        badRequest = true;
                    }
                }

                this.flatlineErrorCount++;
                if (this.flatlineErrorCount > 2) {
                    alert((!badRequest) ? messages.errors.badRequest : messages.errors.general);
                    this.stopCPR();
                }
                return false;
            })
    }

    /**
     * stopCPR() Stop automatic pings/CPR
     * to server
     *
     * @return void
     */
    stopCPR() {
        this.heartbeatCheckbox.checked = false;
        App.setSetting('send-heartbeat', "false");
        if (typeof cprTimer == "object") cprTimer.stop();
    }

    /**
     * updateLastHeartbeat() Update last ping on UI
     *
     * @param  {String} expires_on when heartbeat expires on the server
     * @return void
     */
    updateLastHeartbeat(expires_on) {

        expires_on = ((expires_on) ? expires_on : moment().subtract(1, 'minute'));

        let nowHR = moment().format(DATETIME_FORMAT),
            expiresHR = moment(expires_on).format(DATETIME_FORMAT);

        this.lastHeartbeat.innerHTML = nowHR;
        this.lastHeartbeat.title = 'Expires on: ' + expiresHR;

        App.setSetting('last-heartbeat', nowHR);
        App.setSetting('last-heartbeat-expiry', expiresHR);
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
     * toggleGoOfflineButton() If ping is currently valid
     * allow user to go offline
     *
     * @return {Boolean} Whether is visible or not
     */
    toggleGoOfflineButton() {
        let now = moment();
        let expiry = moment(App.getSetting('last-heartbeat-expiry'), DATETIME_FORMAT);

        if (!expiry.isValid() || !expiry.isAfter(now) || this.flatline) {
            this.flatline = false;
            this.offlineButton.style.display = "none";
            return false;
        }
        this.offlineButton.style.display = "inline-block";
        return true;
    }

    /**
     * goOffline() on button click
     * send flatline signal
     *
     * @return void
     */
    goOffline() {
        this.showModel('success');
        this.sendFlatline();
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
};

// On load start the app
window.addEventListener('load', () => new App());