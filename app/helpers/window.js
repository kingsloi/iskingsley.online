import {
	app,
	BrowserWindow,
	screen,
} from 'electron';
import jetpack from 'fs-jetpack';
import menubar from 'menubar';
import path from 'path';

export default function(options) {
	return new menubar(options);
}