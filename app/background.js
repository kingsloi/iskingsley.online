import { app, Menu } from 'electron';
import createWindow from './helpers/window';
import env from './env';

var opts ={
    "index": "./app.js"
};

var mb = createWindow();

mb.on('after-create-window', function() {
    mb.window.openDevTools()
});