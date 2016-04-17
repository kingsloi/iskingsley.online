'use strict';

var request = require('request');
var shell = require('shell');
var remote = require('remote');

(function($) {

    var App = function() {

        var timeout;
        var heartbeat_timeout;
        var heartbeat_expires_on;

        var $url = $("#url__value");
        var $interval = $("#interval__value");
        var $enabled = $("#enabled__value");
        var $author = $(".author__url");
        var $heartbeat = $(".heartbeat__value");
        var $go_offline = $('#go-offline');

        /**
         * Get heartbeat expiry
         * @return string | false
         */
        var getHeartbeatExpiry = function() {
            return (heartbeat_expires_on ? heartbeat_expires_on : false);
        };

        /**
         * Set heartbeat expiry
         * @param heartbeat expiry datetime from the server
         */
        var setHeartbeatExpiry = function(heartbeat_expiry) {
            heartbeat_expires_on = heartbeat_expiry;
        };

        /**
         * Show/hide go offline button if heartbeat has/hasn't expired
         * @return boolean Whether heartbeat has expired
         */
        var toggleGoOfflineButton = function() {
            var now = new Date();
            var expiry = (getHeartbeatExpiry() ? new Date(getHeartbeatExpiry()) : false);

            if (now > expiry || expiry === false) {
                $go_offline.hide();
                clearTimeout(heartbeat_timeout);
                return true;
            }

            $go_offline.show();
            heartbeat_timeout = setTimeout(toggleGoOfflineButton, 1000);
            return false;
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
         * On Form save
         * @return void
         */
        var saveSettings = function() {
            $('#settings').submit(function(e) {
                e.preventDefault();

                var error = false;
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
                    sendHeartBeat();
                    performCPR();
                }
            });
        };

        /**
         * Send timed heartbeats
         * @return void
         */
        var performCPR = function() {
            if ($enabled.is(":checked")) {
                sendHeartBeat(); //localStorage.getItem('is_online--interval') * 60000
                timeout = setTimeout(performCPR, 1000);
            }
        };


        /**
         * Set settings to localstorage
         * @return void
         */
        var setSettings = function() {
            localStorage.setItem('is_online--url', $.trim($url.val()));
            localStorage.setItem('is_online--interval', $.trim($interval.val()));
            localStorage.setItem('is_online--enabled', $enabled.is(":checked"));
            alert('Settings saved');

            var window = remote.getCurrentWindow();
            window.hide();
        };

        /**
         * Update last ping timestamp
         * @return void
         */
        function updateHeartbeat(expires_on) {
            $heartbeat.html(getDateTime());
            setHeartbeatExpiry(expires_on);
            toggleGoOfflineButton();
            $heartbeat.prop('title', 'Expires: ' + expires_on);
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

        var goOffline = function() {
            $go_offline.click(function(e) {
                e.preventDefault();
                sendFlatline();
            });
        };

        var sendFlatline = function() {
            request(localStorage.getItem('is_online--url') + "&offline=1", function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var body = $.parseJSON(body);
                    if (body.success === true) {
                        console.log('lol');
                        setHeartbeatExpiry(false);
                        toggleGoOfflineButton();
                    }
                } else {
                    alert("Ooops! There was a problem with sending the offline command. Please check the URL and try again.");
                    $enabled.prop('checked', false);
                }
            });
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