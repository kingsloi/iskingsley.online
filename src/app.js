'use strict';

var request = require('request');
var shell = require('shell');
var remote = require('remote');

(function($) {

    var App = function() {

        var timeout;
        var flatline = false;
        var heartbeat_timeout;
        var heartbeat_expires_on;

        var $url = $("#url__value");
        var $author = $(".author__url");
        var $go_offline = $('#go-offline');
        var $enabled = $("#enabled__value");
        var $interval = $("#interval__value");
        var window = remote.getCurrentWindow();
        var $heartbeat = $(".heartbeat__value");

        /**
         * Misc help fuctions
         * @return void
         */
        var helpers = function() {
            $(document).on('click', 'a[href^="http"]', function(event) {
                event.preventDefault();
                shell.openExternal(this.href);
            });
        };

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
            request(localStorage.getItem('is_online--url'), function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var body = $.parseJSON(body);
                    if (body.success === true) {
                        updateHeartbeat(body.expires_on);
                    }
                } else {
                    alert("Ooops! There was a problem with the URL you've supplied. Please check it and try again!");
                    $enabled.prop('checked', false);
                    clearTimeout(timeout);
                }
            });
        };

        /**
         * Send offline signal to server
         * @return void
         */
        var sendFlatline = function() {
            request(localStorage.getItem('is_online--url') + "&offline=1", function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var body = $.parseJSON(body);
                    if (body.success === true) {
                        setHeartbeatExpiry(false);
                        flatline = true;
                        toggleGoOfflineButton();
                    }
                } else {
                    alert("Ooops! There was a problem with sending the offline command. Please check the URL (" + localStorage.getItem('is_online--url') + "&offline=1) and try again.");
                    $enabled.prop('checked', false);
                }
            });
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

                $url.removeClass('input-error').parent().removeClass('has-error');
                $interval.removeClass('input-error').parent().parent().removeClass('has-error');

                if ($enabled.is(":checked")) {
                    if ($.trim($url.val()) == "") {
                        $url.addClass('input-error').parent().addClass('has-error');
                        error = true;
                    }
                    if ($.trim($interval.val()) == "") {
                        $interval.addClass('input-error').parent().parent().addClass('has-error');
                        error = true;
                    }
                }

                if (!error) {
                    setSettings();

                    alert('Settings saved');
                    window.hide();

                    sendHeartBeat();
                    performCPR();
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
                helpers();
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

})(jQuery);