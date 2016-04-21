import { app, BrowserWindow, screen } from 'electron';
import jetpack from 'fs-jetpack';
import menubar from 'menubar';

export default function (name, options) {
    return new menubar({
        'index':'file://' + __dirname + '/app.html'
    });
}
