# WhatsUpp [![Build Status](https://travis-ci.com/alindt/WhatsUpp-PRIVATE.svg?branch=master)](https://travis-ci.com/alindt/WhatsUpp-PRIVATE)

Native desktop app/wrapper for https://web.whatsapp.com. Built with [Electron](https://electronjs.org/).  
This project continues the work of [@Enrico204](https://github.com/Enrico204/Whatsapp-Desktop) and [@bcalik](https://github.com/bcalik/Whatsapp-Desktop)

## Features

* ~Cross platform (OSX, Windows x64, Linux x32/x64 and ARM v7l)~ Linux only (ia32/amd64)
* Native notifications
* System tray icon
* Open links in default browser
* Badge with the number of notifications in the dock/taskbar
* Dock icon bounces when a new message is received
* Focus on contact search input via CTRL+F
* ~Phone info window (s/w versions, battery status, etc)~  FIX NEEDED
* Auto-launch on login
* Start minimized to tray icon
* Logging system (log to console and *userData*/log.log)
* Apply custom CSS stylesheet
* Auto-hide menu bar
* Disabling GPU rendering (useful when dealing with bugged video drivers)
* A couple of things can be configured:
  * Toggle avatar visibility
  * Toggle preview of the messages visibility
  * Set the size for the media thumbs
  * Proxy settings for connection

## Repositories

### TODO

## Command line switches

    --debug-log         Switch file's log level to "debug" (default: "warn")

## Known issues

### Fonts rendering as rectangles after upgrade

Apparently it's caused by an issue of Electron with an older version of Pango. Upgrade Pango at least to `1.40.12` or downgrade to `1.40.5` should fix this. See https://github.com/Enrico204/Whatsapp-Desktop/issues/13

### Tray Icon is displayed wrong in KDE

This is due to some bugs between Electron and KDE on tray icons, see [this comment on issue #27](https://github.com/Enrico204/Whatsapp-Desktop/issues/27#issuecomment-338410450) and [vector-im/riot-web#3133](https://github.com/vector-im/riot-web/issues/3133). A workaround is to uninstall `libappindicator` and `libappindicator-gtk3` packages (this will change also the behavior of click on the tray icon).

## Contributions

Contributions are welcome! For feature requests and bug reports please submit an [issue](https://github.com/alindt/WhatsUpp/issues).

## Build from source

To build from the source, run the following commands:

```
yarn install
yarn run build:$platform
```

where `$platform` can be one of `linux32`, `linux64` or `linux` (builds both).

You'll find artifacts in the `./dist/` directory.

## Run on-the-fly (for devs)

Run `yarn run dev` (in project root) instead of compiling the code each time.
