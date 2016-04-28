"use strict";

import { remote, shell } from "electron";
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

let isAnyTextSelected = () => window.getSelection().toString() !== "";

let cut = new MenuItem({
    label: "Cut",
    click: () => {
        document.execCommand("cut");
    }
});

let copy = new MenuItem({
    label: "Copy",
    click: () => {
        document.execCommand("copy");
    }
});

let paste = new MenuItem({
    label: "Paste",
    click: () => {
        document.execCommand("paste");
    }
});

let author = new MenuItem({
    label: "Made with \u2665 by Kingsley Raspe",
    click: () => {
        shell.openExternal("http://kingsleyraspe.co.uk");
    }
});

let copyMenu = new Menu();
copyMenu.append(copy);
copyMenu.append(author);

let textEditingMenu = new Menu();
textEditingMenu.append(cut);
textEditingMenu.append(copy);
textEditingMenu.append(paste);
textEditingMenu.append(author);

let authorOnly = new Menu();
authorOnly.append(author);

document.addEventListener("contextmenu", e => {
    switch (e.target.nodeName) {
    case "TEXTAREA":
    case "INPUT":
        e.preventDefault();
        textEditingMenu.popup(remote.getCurrentWindow());
        break;
    default:
        if (isAnyTextSelected()) {
            e.preventDefault();
            copyMenu.popup(remote.getCurrentWindow());
        } else {
            authorOnly.popup(remote.getCurrentWindow());
        }
    }
}, false);