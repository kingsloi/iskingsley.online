/*global navigator, localStorage: false, console: false, $: false */
// Imports

import os from 'os';
import request from 'superagent';
import {
    remote,
    ipcRenderer
} from 'electron';
import jetpack from 'fs-jetpack';
import env from './env';

// Globals
var app = remote.app;
var ipc = ipcRenderer;
var shell = remote.shell;
var appDir = jetpack.cwd(app.getAppPath());

// App
(function ($) {

    'use strict';

    var App = function () {

        var timeout;
        var flatline = false;

        var $save = $('#save');
        var $model = $(".model");
        var $url = $("#url__value");
        var $reset = $("#reset-settings");
        var $go_offline = $('#go-offline');
        var $actions = $('.actions button');
        var $enabled = $("#enabled__value");
        var $interval = $("#interval__value");
        var $heartbeat = $(".heartbeat__value");

        var errors = {
            heartbeat: {
                count: 0,
                message: "Ooops! There was a problem with the URL you've supplied. Please check it and try again!",
                badRequest: "Heartbeat refused by the server. Incorrect password maybe?"
            },
            flatline: {
                count: 0,
                message: "Ooops! There was a problem with sending the offline command. Please check the URL (" + localStorage.getItem('is_online--url') + "&offline=1) and try again.",
                badRequest: "Flatline refused by the server. Incorrect password maybe?"
            }
        };

        /**
         * Set heartbeat datetime
         * @param heartbeat_datetime date/time of last ping
         */
        var setHeartbeatDateTime = function (heartbeat_datetime) {
            localStorage.setItem('is_online--heartbeat', heartbeat_datetime);
        };

        /**
         * Get last heartbeat
         * @return string | false
         */
        var getHeartbeatDateTime = function () {
            if (localStorage.getItem('is_online--heartbeat')) {
                return localStorage.getItem('is_online--heartbeat');
            }
            return false;
        };

        /**
         * Set heartbeat expiry
         * @param heartbeat expiry datetime from the server
         */
        var setHeartbeatExpiry = function (heartbeat_expiry) {
            localStorage.setItem('is_online--heartbeat-expires-on', heartbeat_expiry);
        };

        /**
         * Get heartbeat expiry
         * @return string | false
         */
        var getHeartbeatExpiry = function () {
            if (localStorage.getItem('is_online--heartbeat-expires-on')) {
                return localStorage.getItem('is_online--heartbeat-expires-on');
            }
            return false;
        };

        /**
         * Get last heartbeat
         * @return void
         */
        var getLastHeartbeat = function () {
            if (getHeartbeatDateTime()) {
                $heartbeat.html(getHeartbeatDateTime());
                $heartbeat.prop('title', 'Expires: ' + getHeartbeatExpiry());
            }
        };

        /**
         * Clear settings from localstorage
         * @return void
         */
        var removeSettings = function () {
            localStorage.removeItem('is_online--url');
            localStorage.removeItem('is_online--interval');
            localStorage.removeItem('is_online--enabled');
        };

        /**
         * Set settings to localstorage
         * @return void
         */
        var setSettings = function () {
            localStorage.setItem('is_online--url', $.trim($url.val()));
            localStorage.setItem('is_online--interval', $.trim($interval.val()));
            localStorage.setItem('is_online--enabled', $enabled.is(":checked"));
        };

        /**
         * Get settings from localstorage
         * @return void
         */
        var getSettings = function () {
            if (localStorage.getItem('is_online--url')) {
                $url.val(localStorage.getItem('is_online--url'));
            }
            if (localStorage.getItem('is_online--interval')) {
                $interval.val(localStorage.getItem('is_online--interval'));
            }
            if (localStorage.getItem('is_online--enabled')) {
                if (localStorage.getItem('is_online--enabled') === true) {
                    $enabled.prop('checked', true);
                }
            }
        };

        /**
         * Is user connected to wifi/lan?
         * @return boolean
         */
        function isUserConnectedToInternet() {
            return ((navigator.onLine) ? true : false);
        }

        /**
         * Toggle disconnected model
         * @return boolean Whether online or offline
         */
        var toggleDisconnectedModel = function () {
            var online = isUserConnectedToInternet();
            if (!online) {
                showModel('disconnected');
                $actions.attr("disabled", true);
                return false;
            }
            hideModel();
            $actions.attr("disabled", false);
            return true;
        };

        /**
         * Show/hide go offline button if heartbeat has/hasn't expired
         * @return boolean Whether heartbeat has expired
         */
        var toggleGoOfflineButton = function () {
            var now = new Date();
            var expiry = ((getHeartbeatExpiry()) ? new Date(getHeartbeatExpiry()) : false);

            if (now > expiry || expiry === false || flatline === true) {
                $enabled.prop('checked', false);
                setSettings();
                $go_offline.hide();
                return true;
            }

            $go_offline.show();
            return false;
        };

        /**
         * Tasks executed by main process
         * @return void
         */
        var registerIpcEvents = function () {
            ipc.on('OnCreateOrShowEvents', function () {
                getLastHeartbeat();
                toggleGoOfflineButton();
                toggleDisconnectedModel();
            });
        };

        /**
         * Send heartbeat to specified URL
         * @return boolean
         */
        var sendHeartBeat = function () {
            if (!isUserConnectedToInternet()) {
                return false;
            }
            var badRequest = false;

            request
                .get(localStorage.getItem('is_online--url'))
                .query({
                    interval: localStorage.getItem('is_online--interval')
                })
                .end(function (error, response) {
                    if (response.type === "application/json" && !error) {
                        var body = tryParseJSON(response.text);
                        if (response.status === 200 && body.success === true) {
                            errors.heartbeat.count = 0;
                            updateHeartbeat(body.expires_on);
                            return true;
                        }
                        badRequest = true;
                    }

                    errors.heartbeat.count++;
                    if (errors.heartbeat.count > 2) {
                        alert((!badRequest) ? errors.heartbeat.message : errors.heartbeat.badRequest);
                        $enabled.prop('checked', false);
                        clearTimeout(timeout);
                    }
                    return false;
                });
        };

        /**
         * Send offline signal to server
         * @return boolean
         */
        var sendFlatline = function () {
            if (!isUserConnectedToInternet()) {
                return false;
            }
            var badRequest = false;

            request
                .get(localStorage.getItem('is_online--url'))
                .query({
                    offline: '1'
                })
                .end(function (error, response) {

                    if (response.type === "application/json" && !error) {
                        var body = tryParseJSON(response.text);
                        if (response.status === 200 && body.success === true) {
                            flatline = true;
                            showModel('success');
                            errors.flatline.count = 0;
                            setHeartbeatExpiry(false);
                            toggleGoOfflineButton('hide');
                            return true;
                        }
                        badRequest = true;
                    }

                    errors.flatline.count++;
                    if (errors.flatline.count > 2) {
                        alert((!badRequest) ? errors.flatline.message : errors.flatline.badRequest);
                        $enabled.prop('checked', false);
                    }
                    return false;
                });
        };

        /**
         * On Form save
         * @return boolean
         */
        var saveSettings = function () {
            $('#settings').submit(function (e) {
                e.preventDefault();

                var error = false;
                flatline = false;
                clearTimeout(timeout);

                $url.parent().removeClass('has-error');
                $interval.parent().parent().removeClass('has-error');

                if ($enabled.is(":checked")) {
                    if ($.trim($url.val()) == "") {
                        $url.parent().addClass('has-error');
                        error = true;
                    }
                    if ($.trim($interval.val()) == "") {
                        $interval.parent().parent().addClass('has-error');
                        error = true;
                    }
                }

                if (!error) {
                    showModel('success');
                    setSettings();
                    toggleSaveButton('hide');
                    if ($enabled.is(":checked")) {
                        sendHeartBeat();
                        performCPR();
                    }
                    return true;
                }
                showModel('failure');
                return false;
            });
        };

        /**
         * On go offline button click
         * @return void
         */
        var goOffline = function () {
            $go_offline.click(function (e) {
                e.preventDefault();
                sendFlatline();
            });
        };

        /**
         * Send timed heartbeats
         * @return void
         */
        var performCPR = function () {
            if ($enabled.is(":checked")) {
                sendHeartBeat();
                clearTimeout(timeout);
                timeout = setTimeout(performCPR, localStorage.getItem('is_online--interval') * 60000);
            }
        };

        /**
         * Update last ping timestamp
         * @return void
         */
        function updateHeartbeat(expires_on, override = false) {

            var heartbeat_on = getDateTime();

            $heartbeat.html(heartbeat_on);
            $heartbeat.prop('title', 'Expires: ' + expires_on);
            $heartbeat.animateCss('beat');

            setHeartbeatDateTime(heartbeat_on);
            setHeartbeatExpiry(expires_on);
            toggleGoOfflineButton();
        }

        /**
         * Check for user input on any of the inputs, showing settings button
         * if text/checkbox gets touched by the user
         * @return void
         */
        var checkForInput = function () {
            $(':text').keypress(function (e) {
                toggleSaveButton();
            });
            $(':text').keyup(function (e) {
                if (e.toggleSaveButton == 8 || e.keyCode == 46) {
                    enableSaveBtn();
                } else {
                    e.preventDefault();
                }
            });
            $(':text').bind('paste', function (e) {
                toggleSaveButton();
            });
            $(':checkbox').change(function (e) {
                toggleSaveButton();
            });
        };

        /**
         * Exit application
         * @return void
         */
        var registerButtonClicks = function () {
            $('#close-model').click(function () {
                hideModel();
            });
            $('#exit-application a').click(function () {
                var exit = confirm("Are you sure you want to exit?");
                if (exit === true) {
                    app.quit();
                }
            });
        };

        /**
         * On clear button click
         * @return void
         */
        var clearSettings = function () {
            $reset.click(function (e) {
                e.preventDefault();
                var reset = confirm("Are you sure you want clear your settings and reset the application?");
                if (reset === true) {
                    removeSettings();
                    location.reload();
                }
            });
        };

        /**
         * Try parse json
         * @param  string json json string to validate
         * @return string | boolean
         */
        function tryParseJSON(json) {
            try {
                var o = JSON.parse(json);

                // Handle non-exception-throwing cases:
                // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                // but... JSON.parse(null) returns 'null', and typeof null === "object",
                // so we must check for that, too.
                if (o && typeof o === "object" && o !== null) {
                    return o;
                }
            } catch (e) {
                console.log(e);
            }
            return false;
        }

        /**
         * Hide model
         * @return void
         */
        var hideModel = function () {
            $model.removeClass('model--is-failure')
                .removeClass('model--is-success')
                .removeClass('model--is-disconnected');
        };

        /**
         * Show model
         * @param  string type Type of model to show (success/failure)
         * @return void
         */
        var showModel = function (type) {
            hideModel();
            switch (type) {
            case 'success':
                $model.addClass('model--is-success').animateCss('fadeinout');
                break;
            case 'failure':
                $model.addClass('model--is-failure').animateCss('fadeinout');
                break;
            case 'disconnected':
                $model.addClass('model--is-disconnected');
                break;
            }
        }

        /**
         * Toggle save button
         * @return boolean | void
         */
        function toggleSaveButton(type = 'show') {
            if (type == 'show' && $save.is(":visible")) {
                return false;
            }
            $save.toggle();
        }

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

        return {
            init: function () {

                clearSettings();
                checkForInput();
                getSettings();
                saveSettings();
                goOffline();
                registerButtonClicks();
                registerIpcEvents();
                toggleGoOfflineButton();
                if ($enabled.is(":checked")) {
                    sendHeartBeat();
                    performCPR();
                }
            }
        };
    }();

    $(document).ready(function () {
        App.init();
    });

})($);