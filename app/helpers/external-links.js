"use strict";

import shell from "electron";

document.addEventListener("click", e => {
    let isExternal = false;
    let checkDomElement = element => {
        let href = "";

        if (element.nodeName === "A") {
            href = element.getAttribute("href");
        }

        if (element.classList.contains("js-external-link")) {
            isExternal = true;
        }

        if (href && isExternal) {
            shell.openExternal(href);
            e.preventDefault();
        } else if (element.parentElement) {
            checkDomElement(element.parentElement);
        }
    };
    checkDomElement(e.target);
}, false);
