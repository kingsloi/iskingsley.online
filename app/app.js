import os from 'os';
import request from 'superagent';

import $ from 'jquery';
import {
    remote,
    ipcRenderer
} from 'electron';

import jetpack from 'fs-jetpack';
import env from './env';

var app = remote.app;
var ipc = ipcRenderer;
var shell = remote.shell;
var appDir = jetpack.cwd(app.getAppPath());


console.log('The author of this app is:', appDir.read('package.json', 'json').author);

(function($) {
    'use strict';
    var App = function() {

        var timeout;
        var flatline = false;
        var heartbeat_timeout;
        var heartbeat_expires_on;

        var $save = $('#save');
        var $model = $(".model");
        var $url = $("#url__value");
        var $author = $(".author__url");
        var $go_offline = $('#go-offline');
        var $enabled = $("#enabled__value");
        var $interval = $("#interval__value");
        var window = remote.getCurrentWindow();
        var $heartbeat = $(".heartbeat__value");


        /**
         * Set heartbeat expiry
         * @param heartbeat expiry datetime from the server
         */
        var setHeartbeatExpiry = function(heartbeat_expiry) {
            heartbeat_expires_on = heartbeat_expiry;
        };

        /**
         * Get heartbeat expiry
         * @return string | false
         */
        var getHeartbeatExpiry = function() {
            return (heartbeat_expires_on ? heartbeat_expires_on : false);
        };

        /**
         * Set settings to localstorage
         * @return void
         */
        var setSettings = function() {
            localStorage.setItem('is_online--url', $.trim($url.val()));
            localStorage.setItem('is_online--interval', $.trim($interval.val()));
            localStorage.setItem('is_online--enabled', $enabled.is(":checked"));
        };

        /**
         * Get settings from localstorage
         * @return void
         */
        var getSettings = function() {
            if (localStorage.getItem('is_online--url')) {
                $url.val(localStorage.getItem('is_online--url'));
            }
            if (localStorage.getItem('is_online--interval')) {
                $interval.val(localStorage.getItem('is_online--interval'));
            }
            if (localStorage.getItem('is_online--enabled')) {
                if (localStorage.getItem('is_online--enabled') == "true") {
                    $enabled.prop('checked', true);
                }
            }
        };

        /**
         * Show/hide go offline button if heartbeat has/hasn't expired
         * @return boolean Whether heartbeat has expired
         */
        var toggleGoOfflineButton = function() {
            var now = new Date();
            var expiry = (getHeartbeatExpiry() ? new Date(getHeartbeatExpiry()) : false);

            if (now > expiry || expiry === false || flatline === true) {
                $enabled.prop('checked', false);
                setSettings();
                $go_offline.hide();
                return true;
            }

            $go_offline.show();
            clearTimeout(heartbeat_timeout);
            heartbeat_timeout = setTimeout(toggleGoOfflineButton, 1000);
            return false;
        };

        /**
         * Send heartbeat to specified URL
         * @return void
         */
        var sendHeartBeat = function() {

            request
                .get(localStorage.getItem('is_online--url'))
                .end(function(error, response) {
                    if (!error && response.status == 200) {
                        console.log(response.type);
                        var body = $.parseJSON(response.text);

                        if (body.success === true) {
                            updateHeartbeat(body.expires_on);
                        }
                        return true;
                    }

                    alert("Ooops! There was a problem with the URL you've supplied. Please check it and try again!");
                    $enabled.prop('checked', false);
                    clearTimeout(timeout);
                    return false;
                });
        };

        /**
         * Send offline signal to server
         * @return void
         */
        var sendFlatline = function() {

            request
                .get(localStorage.getItem('is_online--url'))
                .query({
                    offline: '1'
                }).end(function(error, response) {
                    if (!error && response.status == 200) {
                        var body = $.parseJSON(response.text);
                        if (body.success === true) {
                            setHeartbeatExpiry(false);
                            flatline = true;
                            toggleGoOfflineButton();
                        }
                        return true;
                    }
                    alert("Ooops! There was a problem with sending the offline command. Please check the URL (" + localStorage.getItem('is_online--url') + "&offline=1) and try again.");
                    $enabled.prop('checked', false);
                })
        };

        /**
         * On Form save
         * @return void
         */
        var saveSettings = function() {
            $('#settings').submit(function(e) {
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
                    setSettings();

                    $model.animateCss('fadeInDownBig');

                    if ($enabled.is(":checked")) {
                        sendHeartBeat();
                        performCPR();
                    }

                    setTimeout(function() {
                        $model.animateCss('fadeOutUpBig');
                        toggleSaveButton('hide');
                    }, 1000);
                }
            });
        };

        /**
         * On go offline button click
         * @return void
         */
        var goOffline = function() {
            $go_offline.click(function(e) {
                e.preventDefault();
                sendFlatline();
            });
        };

        /**
         * Send timed heartbeats
         * @return void
         */
        var performCPR = function() {
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
        function updateHeartbeat(expires_on) {
            $heartbeat.html(getDateTime());
            $heartbeat.prop('title', 'Expires: ' + expires_on);
            setHeartbeatExpiry(expires_on);
            toggleGoOfflineButton();
        };

        /**
         *
         */
        var checkForInput = function() {
            // text written
            $(':text').keypress(function(e) {
                toggleSaveButton();
            });
            //backspace and delete key
            $(':text').keyup(function(e) {
                if (e.toggleSaveButton == 8 || e.keyCode == 46) {
                    enableSaveBtn();
                } else {
                    // rest ignore
                    e.preventDefault();
                }
            });
            // text pasted
            $(':text').bind('paste', function(e) {
                toggleSaveButton();
            });
            // select element changed
            $(':checkbox').change(function(e) {
                toggleSaveButton();
            });
        };

        /**
         * [toggleSaveButton description]
         * @return {[type]} [description]
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
        };

        /**
         * Add a 0 for single-digit date/time values
         * @param int
         * @return string
         */
        function AddZero(num) {
            return (num >= 0 && num < 10) ? "0" + num : num + "";
        };

        return {
            init: function() {

                $.fn.extend({
                    animateCss: function(animationName) {
                        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
                        $(this).addClass('animated ' + animationName).one(animationEnd, function() {
                            $(this).removeClass('animated ' + animationName);
                        });
                    }
                });

                checkForInput();
                getSettings();
                saveSettings();
                goOffline();
                toggleGoOfflineButton();

                if ($enabled.is(":checked")) {
                    sendHeartBeat();
                    performCPR();
                }
            }
        };
    }();

    $(document).ready(function() {
        App.init();
    });

})($);