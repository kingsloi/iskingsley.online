(function () {
    'use strict';

    var shell = require('electron').shell;

    var supportExternalLinks = function (e) {
        var href;
        var isExternal = false;

        var checkDomElement = function (element) {
            if (element.nodeName === 'A') {
                href = element.getAttribute('href');
            }
            if (element.classList.contains('js-external-link')) {
                isExternal = true;
            }
            if (href && isExternal) {
                shell.openExternal(href);
                e.preventDefault();
            } else if (element.parentElement) {
                checkDomElement(element.parentElement);
            }
        }

        checkDomElement(e.target);
    }

    document.addEventListener('click', supportExternalLinks, false);
}());