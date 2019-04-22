# WhatsUpp [![CircleCI](https://circleci.com/gh/alindt/WhatsUpp/tree/master.svg?style=shield&circle-token=ee4ce35cba209e8d63e4df51ae5545468820e0ef)](https://circleci.com/gh/alindt/WhatsUpp/tree/master) [![CodeFactor](https://www.codefactor.io/repository/github/alindt/whatsupp/badge/master)](https://www.codefactor.io/repository/github/alindt/whatsupp/overview/master) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) ![libraries.io](https://img.shields.io/librariesio/github/alindt/WhatsUpp.svg)

Linux native desktop app/wrapper for https://web.whatsapp.com. Built with [Electron](https://electronjs.org/).  
This project continues the work of [@Enrico204](https://github.com/Enrico204/Whatsapp-Desktop) and [@bcalik](https://github.com/bcalik/Whatsapp-Desktop)

## Features

* ~Cross platform (OSX, Windows x64, Linux x32/x64 and ARM v7l)~ Linux only (ia32/amd64)
* Native notifications
* System tray icon
* Open links in default browser
* Badge with the number of notifications in the tray/dock/taskbar
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

## Command line switches

    --debug-log         Switch file's log level to "debug" (default: "warn")

## Contributions

Contributions are welcome! For feature requests and bug reports please submit an [issue](https://github.com/alindt/WhatsUpp/issues).

## Build from source

To build from the source, run the following commands:

```
yarn install
yarn build:$platform
```

where `$platform` can be one of `linux32`, `linux64` or `linux` (builds both).

You'll find artifacts in the `./dist/` directory.

## Run on-the-fly (for devs)

Run `yarn dev` (in project root) instead of compiling the code each time.

## Buy me a beer!

If you find this project useful consider buying me a beer :)

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/alindt/donate)
[![Donate](https://www.paypalobjects.com/digitalassets/c/website/marketing/apac/C2/logos-buttons/optimize/26_Blue_PayPal_Pill_Button.png)](https://paypal.me/alintraistaru)

