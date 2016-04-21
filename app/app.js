import os from 'os';
import request from 'superagent';


import $ from 'jquery';
import { remote } from 'electron';

import jetpack from 'fs-jetpack';
import env from './env';

var app = remote.app;
var shell = remote.shell;
var appDir = jetpack.cwd(app.getAppPath());


import { greet } from './hello_world/hello_world';


console.log('The author of this app is:', appDir.read('package.json', 'json').author);


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

        return {
            init: function() {
            	helpers();
            }
        };
    }();

    $(document).ready(function() {
        App.init();
    });

})($);