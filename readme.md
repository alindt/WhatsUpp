# WhatsUpp [![CircleCI](https://circleci.com/gh/alindt/WhatsUpp/tree/master.svg?style=shield&circle-token=ee4ce35cba209e8d63e4df51ae5545468820e0ef)](https://circleci.com/gh/alindt/WhatsUpp/tree/master) [![CodeFactor](https://www.codefactor.io/repository/github/alindt/whatsupp/badge/master)](https://www.codefactor.io/repository/github/alindt/whatsupp/overview/master) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) ![libraries.io](https://img.shields.io/librariesio/github/alindt/WhatsUpp.svg)

Linux native desktop app/wrapper for https://web.whatsapp.com. Built with [Electron](https://electronjs.org/).  
This project continues the work of [@Enrico204](https://github.com/Enrico204/Whatsapp-Desktop) and [@bcalik](https://github.com/bcalik/Whatsapp-Desktop)

## Features

* ![OK](https://img.shields.io/badge/-OK-green.svg) Linux only (ia32/amd64)
* ![OK](https://img.shields.io/badge/-OK-green.svg) Native notifications
* ![OK](https://img.shields.io/badge/-OK-green.svg) System tray icon
* ![OK](https://img.shields.io/badge/-OK-green.svg) Open links in default browser
* ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Badge with the number of notifications in the tray/dock/taskbar
* ![FIX](https://img.shields.io/badge/-FIX-red.svg) Focus on contact search input via CTRL+F
* ![FIX](https://img.shields.io/badge/-FIX-red.svg) Phone info window (s/w versions, battery status, etc)
* ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Auto-launch on login
* ![OK](https://img.shields.io/badge/-OK-green.svg) Start minimized to tray icon
* ![OK](https://img.shields.io/badge/-OK-green.svg) Logging system (log to console and `$HOME/.config/WhatsUpp/log.log`)
* ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Apply custom CSS stylesheet
* ![OK](https://img.shields.io/badge/-OK-green.svg) Auto-hide menu bar
* ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Disabling GPU rendering (useful when dealing with bugged video drivers)
* A couple of things can be configured:
  * ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Toggle avatar visibility
  * ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Toggle preview of the messages visibility
  * ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Set the size for the media thumbs
  * ![TEST](https://img.shields.io/badge/-TEST-blue.svg) Proxy settings for connection

## Command line switches

    --debug-log         Switch file's log level to "debug" (default: "warn")

## Contributions

Contributions are welcome! For feature requests and bug reports please submit an [issue](https://github.com/alindt/WhatsUpp/issues).

## Build from source

```
git clone https://github.com/alindt/WhatsUpp
cd WhatsUpp
yarn install
yarn build:$platform
```

`$platform` can be one of `linux32`, `linux64` or `linux` (builds both).

You'll find artifacts in the `./dist/` directory.

## Run on-the-fly (for devs)

Run `yarn dev` (in project root) instead of compiling the code each time.
