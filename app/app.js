// Core
// import os from 'os';
import { ipcRenderer } from 'electron';
// import jetpack from 'fs-jetpack';
// import env from './env';

// Plugins
import superagent from 'superagent';
// import logger from 'superagent-logger';
import validator from 'validator';
import animateCss from 'animate.css-js';
import Stopwatch from 'timer-stopwatch';
import moment from 'moment';

// Helpers
import './helpers/context-menu';
import './helpers/external-links';

// Global Node variables
// const app = remote.app;
const ipc = ipcRenderer;
// const shell = remote.shell;
// const appDir = jetpack.cwd(app.getAppPath());

// Global App variables
let cprTimer;
let getElmById = id => document.getElementById(id); // jshint ignore:line
let heartbeatButtonClicks = 0;
let heartbeatClickTimer = null;

// Global Constants
const CLICK_DELAY = 300;
const DATETIME_FORMAT = 'DD/MM/YY hh:mm A';
const messages = {
    errors: {
        general: 'Ooops! There was a problem with the URL you\'ve supplied. ' +
            'Please check it and try again',
        badRequest: 'Heartbeat refused by the server. Incorrect password maybe?'
    },
    confirm: {
        reset: 'Are you sure you want to reset the application?',
        exit: 'Are you sure you want to exit?'
    }
};

class App {

    constructor() {

        this.flatline = false;
        this.flatlineErrorCount = 0;
        this.heartbeatErrorCount = 0;
        this.flatlineBadRequest = false;
        this.heartbeatBadRequest = false;

        // Shortcuts to DOM elements
        this.modal = getElmById('modal');
        this.urlInput = getElmById('url');

        this.settingsPanel = getElmById('settings-panel');
        this.settingsHideButton = getElmById('settings-btn-hide');
        this.settingsShowButton = getElmById('settings-btn-show');

        this.exitButton = getElmById('exit');
        this.saveButton = getElmById('save');
        this.appContainer = getElmById('app');
        this.heartButton = getElmById('heart');
        this.intervalInput = getElmById('interval');
        this.offlineButton = getElmById('go-offline');
        this.settingsForm = getElmById('settings-form');
        this.resetButton = getElmById('reset-settings');
        this.lastHeartbeat = getElmById('last-heartbeat');
        this.closeModalButton = getElmById('close-modal');
        this.heartbeatCheckbox = getElmById('send-heartbeat');
        this.heartbeatButton = getElmById('heart');

        // Event Listeners
        this.exitButton.addEventListener('click', () => this.exit());
        this.settingsShowButton.addEventListener('click', () => this.toggleSettingsPanel());
        this.settingsHideButton.addEventListener('click', () => this.toggleSettingsPanel());

        // this.saveButton.addEventListener('click', () => this.saveSettings());
        // //this.offlineButton.addEventListener('click', () => this.goOffline());
        // this.resetButton.addEventListener('click', () => App.resetSettings());
        // this.urlInput.addEventListener('input', () => this.toggleSaveButton());
        // this.settingsForm.addEventListener('submit', e => this.submitForm(e));
        // //this.pingNowButton.addEventListener('click', () => this.sendHeartbeat());
        // this.closeModalButton.addEventListener('click', e => this.closeModal(e));
        // this.intervalInput.addEventListener('input', () => this.toggleSaveButton());
        // this.intervalInput.addEventListener('keydown', e => this.validateInterval(e));
        // this.heartbeatCheckbox.addEventListener('change', () => this.toggleSaveButton());



        this.heartbeatButton.addEventListener('click', () => this.handleHeartClick());
        this.heartbeatButton.addEventListener('dblclick', e => this.handleHeartDblClick(e));

        // Load previously saved settings
        Object.keys(localStorage).forEach(key =>
            this.getSettings(key, localStorage[key])
        );

        this.init();
    }

    /**
     * toggleSettingsPanel() Show/hide settings panel
     *
     * @return {Boolean}
     */
    toggleSettingsPanel() {
        let visible = App.isElementVisible(this.settingsPanel);
        if (visible) {
            this.settingsPanel.classList.remove('settings--is-visible');
            return false;
        }
        this.settingsPanel.classList.add('settings--is-visible');
        return true;
    }

    /**
     * handleHeartClick() Handle two different types of click
     * on the heart. If 1, ping now, if double click, toggle heartbeats
     *
     * @return void
     */
    handleHeartClick() {
        heartbeatButtonClicks++;
        if (heartbeatButtonClicks === 1) {
            heartbeatClickTimer = setTimeout(function () {
                alert('Single Click');
                heartbeatButtonClicks = 0;
            }, CLICK_DELAY);
        } else {
            clearTimeout(heartbeatClickTimer);
            alert('Double Click');
            heartbeatButtonClicks = 0;
        }
    }

    /**
     * handleHeartDblClick() because we've hacked the
     * clicks, disable normal double clicks
     *
     * @param  {Event} e  event to handle
     * @return void
     */
    handleHeartDblClick(e) {
        e.preventDefault();
    }

    /**
     * resetSettings() reset settings/application
     * from scratch
     *
     * @return void
     */
    static resetSettings() {
        const sure = confirm(messages.confirm.reset);
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
     * registerIpcEvents() Register render process events
     * called from main js
     *
     * @todo improve maybe but not sure how :(
     * @return void
     */
    registerIpcEvents() {
        ipc.on('OnCreateOrShowEvents', () => {
            this.toggleGoOfflineButton();
            this.toggleDisconnectModal();
        });
        /*
        let shortcut = remote.require('global-shortcut');
        shortcut.register('ctrl+alt+s', function () {
            alert('here');
        });
        */
    }

    /**
     * init() on start of application
     *
     * @return void
     */
    init() {
        this.registerIpcEvents();
        this.toggleGoOfflineButton();
        this.toggleDisconnectModal();
        // if (this.heartbeatCheckbox.checked === true) {
        //     this.sendHeartbeat();
        // }
    }

    /**
     * exit() Exit application
     *
     * @return void
     */
    exit() {
        const sure = confirm(messages.confirm.exit);
        if (sure) {
            ipc.send('exit');
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
            this.showModal('failure');
            return false;
        }

        this.toggleSaveButton('hide');

        let url = this.urlInput;
        let interval = this.intervalInput;
        let heartbeat = this.heartbeatCheckbox;

        App.setSetting('url', url.value);
        App.setSetting('interval', interval.value);
        App.setSetting('send-heartbeat', heartbeat.checked);
        this.showModal('success');

        if (cprTimer) cprTimer.stop();

        // If heartbeat isn't enabled, staph
        if (heartbeat.checked === false) return false;

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
        if (cprTimer) cprTimer.stop();
        let interval = App.getSetting('interval') * 60000;
        cprTimer = new Stopwatch(interval);
        cprTimer.start();
        cprTimer.onDone(() => this.sendHeartbeat());
    }

    /**
     * sendHeartbeat() Ping the server
     *
     * @return {Boolean} whether success or not
     */
    sendHeartbeat() {
        if (!App.isUserConnectedToInternet()) {
            let isCPREnabled = App.getSetting('send-heartbeat');
            if (isCPREnabled === 'true') this.performCPR();
            return false;
        }

        let url = App.getSetting('url'),
            interval = App.getSetting('interval');

        superagent.get(url)
            .query({
                interval: interval
            }).end((error, response) => {
                let success = this.successfulHeartbeat(error, response);
                if (success) {
                    this.unsuccessfulHeartbeat();
                    return false;
                }
                return true;
            });
    }

    /**
     * successfulHeartbeat() What happens on
     * sucessful heartbeat
     *
     * @param  {Objecy}  error     Error from request
     * @param  {Object}  response  Response of ajax request
     * @return {Boolean}           Whether success or not
     */
    successfulHeartbeat(error, response) {
        let isCPREnabled = App.getSetting('send-heartbeat');
        if (response.type === 'application/json' && !error) {
            let body = App.tryParseJSON(response.text);
            if (response.status === 200 && body.success === true) {
                this.heartbeatErrorCount = 0;
                this.heartbeatBadRequest = false;

                this.updateLastHeartbeat(body.expiresOn);
                this.toggleGoOfflineButton();
                if (isCPREnabled === 'true') this.performCPR();
                return true;
            } else {
                this.heartbeatBadRequest = true;
            }
        }
        return false;
    }

    /**
     * unsuccessfulHeartbeat() What happens on
     * unsucessful heartbeat
     *
     * @return void
     */
    unsuccessfulHeartbeat() {
        this.heartbeatErrorCount++;
        if (this.heartbeatErrorCount > 2) {
            alert(!this.heartbeatBadRequest ? messages.errors.badRequest : messages.errors.general);
            this.stopCPR();
        }
    }

    /**
     * sendHeartbeat() Ping the server
     * with the go offline signal
     *
     * @return {Boolean} whether success or not
     */
    sendFlatline() {
        if (!App.isUserConnectedToInternet()) return false;

        let url = App.getSetting('url');

        superagent.get(url)
            .query({
                offline: '1'
            }).end((error, response) => {
                let success = this.successfulFlatline(error, response);
                if (!success) {
                    this.unsuccessfulFlatline();
                    return false;
                }
                return true;
            });
    }

    /**
     * successfulFlatline() What happens on
     * sucessful flatline
     *
     * @param  {Objecy}  error     Error from request
     * @param  {Object}  response  Response of ajax request
     * @return {Boolean}           Whether success or not
     */
    successfulFlatline(error, response) {
        if (response.type === 'application/json' && !error) {
            let body = App.tryParseJSON(response.text);
            if (response.status === 200 && body.success === true) {
                this.flatline = true;
                this.flatlineBadRequest = false;
                this.heartbeatErrorCount = 0;
                this.updateLastHeartbeat(body.expiresOn);
                this.stopCPR();
                this.toggleGoOfflineButton();
                return true;
            } else {
                this.flatlineBadRequest = true;
            }
        }
        return false;
    }

    /**
     * unsuccessfulFlatline() What happens on
     * unsucessful flatline
     *
     * @return void
     */
    unsuccessfulFlatline() {
        this.flatlineErrorCount++;
        if (this.flatlineErrorCount > 2) {
            alert(!this.flatlineBadRequest ? messages.errors.badRequest : messages.errors.general);
            this.stopCPR();
        }
        this.sendFlatline();
    }

    /**
     * stopCPR() Stop automatic pings/CPR
     * to server
     *
     * @return void
     */
    stopCPR() {
        this.heartbeatCheckbox.checked = false;
        App.setSetting('send-heartbeat', 'false');
        if (cprTimer) cprTimer.stop();
    }

    /**
     * updateLastHeartbeat() Update last ping on UI
     *
     * @param  {String} expiresOn when heartbeat expires on the server
     * @return void
     */
    updateLastHeartbeat(expiresOn) {
        let expiry = expiresOn ? moment(expiresOn) : moment().subtract(1, 'minute');

        let nowHR = moment().format(DATETIME_FORMAT),
            expiresHR = expiry.format(DATETIME_FORMAT);

        this.lastHeartbeat.innerHTML = nowHR;
        this.lastHeartbeat.title = expiresOn ? 'Expires on: ' + expiresHR : 'Expired';

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

        if (character !== 8 && (character < 48 || character > 57)) {
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

        let url = this.urlInput;
        let interval = this.intervalInput;
        let heartbeat = this.heartbeatCheckbox;

        if (heartbeat.checked === false) return true;

        let urlOpts = { require_protocol: true }; // jshint ignore:line

        // Remove any other errors
        url.parentElement.classList.remove('has-error');
        interval.parentElement.classList.remove('has-error');

        // Trim whitespace
        url.value = url.value.trim();
        interval.value = interval.value.trim();

        // Validate all the things
        let isURLValid = !validator.isNull(url.value) && validator.isURL(url.value, urlOpts);
        let isIntervalValid = validator.isNumeric(interval.value);

        // If not valid, add error classes
        if (!isURLValid) url.parentElement.classList.add('has-error');
        if (!isIntervalValid) interval.parentElement.classList.add('has-error');

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
        let element = getElmById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value === 'true';
            } else if (element.type === 'text') {
                element.value = value;
            } else {
                element.innerHTML = value;
            }
        }

        if (key === 'last-heartbeat-expiry') {
            this.lastHeartbeat.title = 'Expires on: ' + value;
        }
    }

    /**
     * showModal() Show modal
     *
     * @param  {String} type type of modal to show
     * @return void
     */
    showModal(type) {
        this.hideModal();
        switch (type) {
        case 'success':
            this.modal.classList.add('modal--is-success');
            this.animate('fadeinout');
            break;
        case 'failure':
            this.modal.classList.add('modal--is-failure');
            this.animate('fadeinout');
            break;
        case 'disconnected':
            this.modal.classList.add('modal--is-disconnected');
            break;
        }
    }

    /**
     * hideModal() Hide the modal
     * and remove the success/error classes
     *
     * @return void
     */
    hideModal() {
        // this.modal.classList.remove('modal--is-failure');
        // this.modal.classList.remove('modal--is-success');
        // this.modal.classList.remove('modal--is-disconnected');
    }

    /**
     * closeModal() Close the modal
     *
     * @return void
     */
    closeModal(e) {
        e.preventDefault();
        this.hideModal();
    }

    /**
     * isElementVisible() Is element visible
     * on the screen?
     *
     * @param  {Element}  el Element to check if visible
     * @return {Boolean}     If visible or not
     */
    static isElementVisible(el) {
        let style = window.getComputedStyle(el);
        return style.width !== '' &&
            style.height !== '' &&
            style.opacity !== '' &&
            style.display !== 'none' &&
            style.visibility !== 'hidden';
    }

    /**
     * toggleSaveButton() Toggle save button
     * if input has been edited
     *
     * @param  {String} type Override show/hide
     * @return {Mixed}
     */
    toggleSaveButton(type = 'show') {
        let isVisible = App.isElementVisible(this.saveButton);
        if (type === 'hide') {
            this.saveButton.style.display = 'none';
        } else if (isVisible && type === 'show') {
            return false;
        } else {
            this.saveButton.style.display = 'inline-block';
        }
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
            // this.offlineButton.style.display = 'none';
            return false;
        }
        // this.offlineButton.style.display = 'inline-block';
        return true;
    }

    /**
     * toggleDisconnectModal() If user is connected
     * to the internet
     *
     * @return {Boolean} Whether user is on wifi/lan
     */
    toggleDisconnectModal() {
        let online = App.isUserConnectedToInternet();
        if (!online) {
            this.showModal('disconnected');
            return false;
        }
        this.hideModal('disconnected');
        return true;
    }

    /**
     * goOffline() on button click
     * send flatline signal
     *
     * @return void
     */
    goOffline() {
        this.showModal('success');
        this.sendFlatline();
    }

    /**
     * animate() Using animate.css
     *
     * @param  {String} animationType Animateion CSS class to use
     * @return void
     */
    animate(animationType) {
        animateCss.animate(this.modal, {
            animationName: animationType,
            duration: 500,
            callbacks: [
                () => {
                    // maybe?
                }
            ]
        });
    }

    /**
     * isUserConnectedToInternet() is connected user
     * connected to LAN/WiFI
     *
     * @return {Boolean} Whether connected or not
     */
    static isUserConnectedToInternet() {
        return !!navigator.onLine;
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
            if (typeof o === 'object' && o !== null) {
                return o;
            }
        } catch (e) {
            console.log(e);
        }
        return false;
    }
}

// On load start the app
window.addEventListener('DOMContentLoaded', () => new App()); // jshint ignore:line