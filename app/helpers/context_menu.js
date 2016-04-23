// This gives you default context menu (cut, copy, paste)
// in all input fields and textareas across your app.

(function() {
    'use strict';

    var remote = require('electron').remote;
    var shell = require('electron').shell;
    var Menu = remote.Menu;
    var MenuItem = remote.MenuItem;

    var isAnyTextSelected = function() {
        return window.getSelection().toString() !== '';
    };

    var cut = new MenuItem({
        label: "Cut",
        click: function() {
            document.execCommand("cut");
        }
    });

    var copy = new MenuItem({
        label: "Copy",
        click: function() {
            document.execCommand("copy");
        }
    });

    var paste = new MenuItem({
        label: "Paste",
        click: function() {
            document.execCommand("paste");
        }
    });

    var author = new MenuItem({
        label: "Made with \u2665 by Kingsley Raspe",
        click: function() {
            shell.openExternal('http://kingsleyraspe.co.uk');
        }
    });

    var copyMenu = new Menu();
    copyMenu.append(copy);
    copyMenu.append(author);

    var textEditingMenu = new Menu();
    textEditingMenu.append(cut);
    textEditingMenu.append(copy);
    textEditingMenu.append(paste);
    textEditingMenu.append(author);

    var authorOnly = new Menu();
    authorOnly.append(author);

    document.addEventListener('contextmenu', function(e) {
        switch (e.target.nodeName) {
            case 'TEXTAREA':
            case 'INPUT':
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

}());