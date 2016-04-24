# Are You Online?

![Is kingsley online?](http://i.imgur.com/1RjSV6p.png "Is Kingsley Online?")

Do you work remotely? Are you in a different timezone? Do your colleagues know if you're online? Mine didn't, so I made this simple app to keep them updated.

To achieve this, I ping a given url every _x_ minutes, which updates a timestamp on the server (sort of like a heart beat) and if the timestamp hasn't been updated within a given time period, then you're most likely offline.

To top it off, it's wrapped into a lovely OSX app so no awkawrd/complicated instructions, just download and run.

## Installation
### OSX Application
  - Download the app for your OS from https://github.com/kingsloi/iskingsley.online/releases
  - Unzip, run the `.dmg` installer
  - Drag the app into your Applications folder
  - It's windowless and menuless, and only appears in the tray. Look for the heartbeat/electrocardiogram
  - Set your URL endpoint and a interval to ping

### PHP Endpoint
  - Edit the `index.php` with your details
  - Upload it to your webserver
  - Create a `password.txt` and a `last_updated.txt` somewhere **outside** of the webroot (so they're not publicly accessible). Updating the paths in the `index.php` if necessary.
  - Make both txt files writable
  - Create a random password in `password.txt`
  - Test it in your browser by going to [http://your_url.com?password=your_password](http://your_url.com?password=your_password)

## People using it
_Using it? Share your site! Fork it, edit this readme, add your site/author, and submit a pull request!_
- [http://iskingsley.online](http://iskingsley.online)
- [http://isandrea.online](http://isandrea.online)
- [http://isdavid.online](http://isdavid.online)

## Contributing
   - Contributions are always welcome
   - It's built with [Electron](http://electron.atom.io/)
   - See below how to get up and running, edit & submit a pull request.

### Getting Started
```bash
git clone https://github.com/kingsloi/iskingsley.online.git
cd electron-boilerplate
npm install
npm start
```
## License
The MIT License (MIT)

Copyright (c) 2016 Kingsley Raspe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
