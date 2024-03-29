// vim: set ts=2 sw=2 expandtab:

/* global _, whatsUpp, gt, config, settings, onlyWin, onlyLinux, onlyOSX, about, phoneinfo, autolauncher */

/*
  eslint new-cap:
    ["error", {
      "newIsCapExceptions": ["parseFloat", "Buffer.from"],
      "capIsNewExceptions": ["ContextMenu"]
    }]
*/

(function (scope) {
  'use strict'

  const app = require('electron').app
  const AppMenu = require('electron').Menu
  const MenuItem = require('electron').MenuItem
  const AppTray = require('electron').Tray
  const fileSystem = require('fs-extra')
  const NativeImage = require('electron').nativeImage
  const BrowserWindow = require('electron').BrowserWindow
  const NodeGettext = require('node-gettext')
  const gettextParser = require('gettext-parser')
  const AutoLaunch = require('auto-launch')
  const log = require('electron-log')
  const join = require('path').join
  const request = require('request')
  const pjson = require('./package.json')
  const notifier = require('node-notifier')
  const globalShortcut = require('electron').globalShortcut
  const ContextMenu = require('electron-context-menu')
  const find = require('find')
  const pathBasename = require('path').basename
  const pathDirname = require('path').dirname
  const AppSession = require('electron').session
  const isPrimaryInstance = app.requestSingleInstanceLock()

  app.on('second-instance', (event, argv, cwd) => {
    if (whatsUpp.window) {
      if (whatsUpp.window.isMinimized()) {
        whatsUpp.window.restore()
      }
      whatsUpp.window.show()
    }

    let groupLinkOpenRequested = null
    if (argv.length > 1) {
      for (let i = 0; i < argv.length; i++) {
        if (argv[i].indexOf('https://chat.whatsapp.com') >= 0) {
          groupLinkOpenRequested = argv[i]
          log.info('Opening a group link: ' + groupLinkOpenRequested)
          break
        }
      }
    }
    if (groupLinkOpenRequested != null) {
      whatsUpp.window.webContents.executeJavaScript(
        "var el = document.createElement('a');" +
        'el.href = "' + groupLinkOpenRequested + '";' +
        'el.style.display = "none";' +
        "el.rel = 'noopener noreferrer';" +
        "el.id = 'newlink';" +
        'document.body.appendChild(el);' +
        "setTimeout(function() { var el = document.getElementById('newlink'); el.click(); document.body.removeChild(el); }, 500);"
      )
    }
  })

  if (!isPrimaryInstance) {
    log.warn('App is already running. Quit.')
    app.quit()
  }

  app.setAppUserModelId('eu.alindt.whatsupp')
  app.setAsDefaultProtocolClient('whatsapp')

  if (process.argv.indexOf('--debug-log') >= 0) {
    log.transports.file.level = 'debug'
    log.info('Log level set from command line switch')
  }

  if (process.argv.indexOf('--disable-gpu') >= 0) {
    log.warn('Disabling GPU acceleration')
    app.disableHardwareAcceleration()
  }

  log.info('Log init, file ' + app.getPath('userData') + '/log.log')

  let groupLinkOpenRequested = null
  if (process.argv.length > 1) {
    for (let i = 0; i < process.argv.length; i++) {
      if (process.argv[i].indexOf('https://chat.whatsapp.com') >= 0) {
        groupLinkOpenRequested = process.argv[i]
        log.info('Opening a group link: ' + groupLinkOpenRequested)
        break
      }
    }
  }

  global.gt = new NodeGettext()

  const supportedLocales = []
  const localePaths = find.fileSync('messages.po', join(__dirname, 'locale'))

  localePaths.forEach(
    function (localePath) {
      const localeName = pathBasename(pathDirname(localePath))
      // log.debug('Loading locale ' + localeName + ' (' + localePath + ')')
      try {
        gt.addTranslations(localeName, 'messages', gettextParser.po.parse(fileSystem.readFileSync(localePath)))
        supportedLocales.push(localeName)
      } catch (err) {
        log.error(err.message)
        log.warn('Skipping locale ' + localeName + ' (' + localePath + ')')
      }
    })

  log.info('Supported locales: ' + supportedLocales)

  gt.setTextDomain('messages')
  global._ = function (t) {
    return gt.gettext(t)
  }

  // Setting default language to system language if available
  const syslang = (process.env.LC_ALL !== undefined
    ? process.env.LC_ALL
    : (process.env.LANG !== undefined
        ? process.env.LANG
        : (process.env.LC_MESSAGES !== undefined ? process.env.LC_MESSAGES : 'en-US')))

  if (supportedLocales.indexOf(syslang.split('.')[0]) >= 0) {
    log.info('Setting locale ' + syslang.split('.')[0])
    gt.setLocale(syslang.split('.')[0])
  } else {
    log.warn('No supported locale found, defaulting to en_US')
    gt.setLocale('en_US')
  }

  global.autolauncher = new AutoLaunch({ name: app.getName() })

  global.onlyOSX = function (callback) {
    if (process.platform === 'darwin') {
      return Function.bind.apply(callback, this, [].slice.call(arguments, 0))
    }
    return function () {}
  }

  global.onlyLinux = function (callback) {
    if (process.platform === 'linux') {
      return Function.bind.apply(callback, this, [].slice.call(arguments, 0))
    }
    return function () {}
  }

  global.onlyWin = function (callback) {
    if (process.platform === 'win32' || process.platform === 'win64') {
      return Function.bind.apply(callback, this, [].slice.call(arguments, 0))
    }
    return function () {}
  }

  global.config = {
    defaultSettings: {
      width: 1000,
      height: 720,
      thumbSize: 0
    },

    currentSettings: {},

    init () {
      config.loadConfiguration()
      config.saveTimeout = null
    },

    loadConfiguration () {
      log.info('Loading configuration')
      const settingsFile = app.getPath('userData') + '/settings.json'
      try {
        const data = fileSystem.readFileSync(settingsFile)
        if (data !== '' && data !== '{}' && data !== '[]') {
          config.currentSettings = JSON.parse(data)
          log.info('Configuration loaded from ' + settingsFile)
        } else {
          config.currentSettings = config.defaultSettings
          log.warn('Configuration file empty, loading default')
        }
      } catch (e) {
        config.currentSettings = config.defaultSettings
        log.warn('Error loading configuration from ' + settingsFile + ' (' + e + '), loading default')
      }
      // First time configuration - eg. before app init
      if (config.get('disablegpu') === true) {
        log.warn('Disabling GPU acceleration')
        app.disableHardwareAcceleration()
      }
    },

    applyConfiguration () {
      log.info('Applying configuration')
      if (config.get('maximized') && config.get('startminimized') !== true) {
        whatsUpp.window.maximize()
      }
      whatsUpp.window.webContents.on('dom-ready', function (event, two) {
        let fontSize = config.get('fontSize')
        fontSize = (fontSize === undefined) ? 'normal' : fontSize
        const fontCSS = (fontSize !== 'normal') ? 'font-size:' + fontSize + ' !important;' : ''
        this.insertCSS('* { text-rendering: optimizeSpeed !important; -webkit-font-smoothing: subpixel-antialiased !important; ' +
                    fontCSS + '}')

        const imgpath = config.get('background-image')
        if (imgpath !== undefined) {
          // var img = new Buffer(fileSystem.readFileSync(imgpath)).toString('base64')
          const img = new Buffer.from(fileSystem.readFileSync(imgpath)).toString('base64')
          const opacity = parseFloat(config.get('background-opacity')) / 100.0
          const mime = (imgpath.endsWith('.jpg') || imgpath.endsWith('.jpeg'))
            ? 'image/jpg'
            : ((imgpath.endsWith('.png') ? 'image/png' : ((imgpath.endsWith('.gif') ? 'image/gif' : ''))))
          this.insertCSS('.pane-chat-tile { background-image: url(data:' + mime + ';base64,' + img + ') !important; background-size: cover !important; opacity: ' +
                        opacity + ' !important; max-width: 100% !important; }')
        }

        const noAvatar = 'div#pane-side img[draggable="false"] { display: none !important; }'
        const noPreview = 'div > div > span[title] > span { display: none !important; }'

        // var noWAupdate = 'header + span > div > div > div > span[data-icon="alert-update] { display: none !important; }'
        const noWAupdate = 'div#side > span { display: none !important; }'
        this.insertCSS(noWAupdate)

        const thumbSize = '.image-thumb { width: ' + config.currentSettings.thumbSize + 'px  !important;' +
                'height: ' + config.currentSettings.thumbSize + 'px !important;}' +
                '.image-thumb img.image-thumb-body { width: auto !important;' +
                'height: ' + config.currentSettings.thumbSize + 'px !important;}'

        const darkMode = '#pane-side, #pane-side div div div div div div, #side header, #side header div div' +
                '#side div, #side div div, #side div div button, #side div div label, #side div div input,' +
                '#main footer, #main footer div, #main footer div div, #main header, #main header div div span,' +
                '#main header div div div span' +
                '{ background-color: #2E2C2B !important; color: white; }\n' +
                '.message-in { background-color: #75706E !important; }\n' +
                '.message, .media-caption { color: #F0F0F0; }\n' +
                '.message-in .tail-container, .message-in.tail-override-right .tail-container,' +
                '.message-out.tail-override-right .tail-container, .message-in.tail-override-left' +
                '.tail-container { background-image: none !important; }\n' +
                '.block-compose, .block-compose .input-container { background-color: #2E2C2B !important; }\n' +
                '.pane-chat-header, .chat.active, .chat, .chatlist-panel-search, .pane-header.pane-list-header,' +
                '.input-chatlist-search, .chatlist-panel-body, .chatlist-panel-search div label input,' +
                '.chatlist-panel-search div label, #app > div > div > div._3q4NP._1Iexl > div, .message > div > span' +
                ' { background-color: #2E2C2B !important;, background-image: none !important; }\n' +
                '.chat-title, .header-title, .chat-body div span { color: white; }'

        const blurImages = 'div.message-in img, div.message-out img { filter: contrast(25%) blur(8px) grayscale(75%); } \n' +
                'div.message-in:hover img, div.message-out:hover img { filter: none; }'

        if (config.currentSettings.hideAvatars) {
          this.insertCSS(noAvatar)
        }
        if (config.currentSettings.hidePreviews) {
          this.insertCSS(noPreview)
        }
        if (config.currentSettings.darkMode) {
          this.insertCSS(darkMode)
        }
        if (config.currentSettings.blurImages) {
          this.insertCSS(blurImages)
        }

        if (config.currentSettings.thumbSize) {
          this.insertCSS(thumbSize)
        }
        if (config.get('customcss') !== undefined) {
          try {
            this.insertCSS(fileSystem.readFileSync(config.get('customcss'), 'utf-8'))
            log.info('Loaded CSS file: ' + config.get('customcss'))
          } catch (e) {
            log.error('CSS error: ' + e)
          }
        }
      })

      // OSX Dock menu
      if (process.platform === 'darwin') {
        const dockMenu = AppMenu.buildFromTemplate([
          {
            label: 'Show main window',
            click () {
              whatsUpp.window.show()
              whatsUpp.window.setAlwaysOnTop(true)
              whatsUpp.window.focus()
              whatsUpp.window.setAlwaysOnTop(false)
            }
          }
        ])
        app.dock.setMenu(dockMenu)
        app.on('activate', (event, hasVisibleWindows) => {
          whatsUpp.window.show()
          whatsUpp.window.setAlwaysOnTop(true)
          whatsUpp.window.focus()
          whatsUpp.window.setAlwaysOnTop(false)
        })
      }

      if (config.get('trayicon') !== false && whatsUpp.tray === undefined) {
        whatsUpp.createTray()
      } else if (config.get('trayicon') === false && whatsUpp.tray !== undefined) {
        log.info('Destroying tray icon')
        whatsUpp.tray.destroy()
        whatsUpp.tray = undefined
      }
      if (config.get('autostart') === true) {
        autolauncher.isEnabled().then(function (enabled) {
          if (!enabled) {
            autolauncher.enable()
            log.info('Autostart enabled')
          }
        })
      } else {
        autolauncher.isEnabled().then(function (enabled) {
          if (enabled) {
            autolauncher.disable()
            log.info('Autostart disabled')
          }
        })
      }
      whatsUpp.window.setMenuBarVisibility(config.get('autoHideMenuBar') !== true)
      whatsUpp.window.setAutoHideMenuBar(config.get('autoHideMenuBar') === true)

      if (config.get('escCloseMainWindow')) {
        globalShortcut.register('Esc', () => {
          whatsUpp.window.close()
        })
      } else {
        if (globalShortcut.isRegistered('Esc')) {
          globalShortcut.unregister('Esc')
        }
      }
    },

    saveConfiguration () {
      if (config.saveTimeout != null) {
        clearTimeout(config.saveTimeout)
        config.saveTimeout = null
      }
      config.saveTimeout = setTimeout(function () {
        log.info('Saving configuration')
        config.set('maximized', whatsUpp.window.isMaximized())
        if (config.currentSettings === undefined || JSON.stringify(config.currentSettings) === '') {
          // TODO: if we land here, we need to figure why and how. And fix that
          log.error('Configuration empty! This should not happen!')
          return
        }
        fileSystem.writeFileSync(app.getPath('userData') + '/settings.json', JSON.stringify(config.currentSettings, null, 2), 'utf-8')
        config.saveTimeout = null
      }, 2000)
    },

    get (key) {
      return config.currentSettings[key]
    },

    set (key, value) {
      config.currentSettings[key] = value
    },

    unSet (key) {
      if (config.currentSettings.hasOwnProperty(key)) {
        delete config.currentSettings[key]
      }
    }
  }

  global.config.init()

  global.whatsUpp = {
    init () {
      global.whatsUpp.warningIcon = false
      whatsUpp.tray = undefined
      whatsUpp.createMenu()
      // Bitmask: LSB
      // First bit: warning icon (phone disconnected)
      // Second bit: new message red-dot
      global.whatsUpp.iconStatus = 0
      global.whatsUpp.oldIconStatus = 0
      global.whatsUpp.newVersion = null

      whatsUpp.clearCache()
      whatsUpp.openWindow()
      config.applyConfiguration()
    },

    createMenu () {
      log.info('Creating menu')
      whatsUpp.menu =
                AppMenu.buildFromTemplate(require('./menu'))
      AppMenu.setApplicationMenu(whatsUpp.menu)
    },

    setNormalTray () {
      global.whatsUpp.iconStatus = global.whatsUpp.iconStatus & 0xFFFFFFFE
      global.whatsUpp.updateTrayIcon()
    },

    setWarningTray () {
      global.whatsUpp.iconStatus = global.whatsUpp.iconStatus | 0x00000001
      global.whatsUpp.updateTrayIcon()
    },

    isWarningTrayIcon () {
      return (global.whatsUpp.iconStatus & 0x1) > 0
    },

    setNewMessageIcon () {
      global.whatsUpp.iconStatus = global.whatsUpp.iconStatus | 0x00000002
      global.whatsUpp.updateTrayIcon()
    },

    clearNewMessageIcon () {
      global.whatsUpp.iconStatus = global.whatsUpp.iconStatus & 0xFFFFFFFD
      global.whatsUpp.updateTrayIcon()
    },

    isNewMessageIcon () {
      return (global.whatsUpp.iconStatus & 0x2) > 0
    },

    updateTrayIcon () {
      if (global.whatsUpp.oldIconStatus === global.whatsUpp.iconStatus) {
        return
      }
      if (whatsUpp.tray !== undefined && process.platform !== 'darwin') {
        if (global.whatsUpp.isWarningTrayIcon() && !global.whatsUpp.isNewMessageIcon()) {
          log.info('Setting tray icon to warning')
          // whatsUpp.tray.setImage(__dirname + '/assets/icon/iconWarning.png')
          whatsUpp.tray.setImage(join(__dirname, 'assets', 'icon', 'iconWarning.png'))
        } if (global.whatsUpp.isWarningTrayIcon() && global.whatsUpp.isNewMessageIcon()) {
          log.info('Setting tray icon to warning with messages')
          // whatsUpp.tray.setImage(__dirname + '/assets/icon/iconWarningWithMsg.png')
          whatsUpp.tray.setImage(join(__dirname, 'assets', 'icon', 'iconWarningWithMsg.png'))
        } if (!global.whatsUpp.isWarningTrayIcon() && global.whatsUpp.isNewMessageIcon()) {
          log.info('Setting tray icon to normal with messages')
          // whatsUpp.tray.setImage(__dirname + '/assets/icon/iconWithMsg.png')
          whatsUpp.tray.setImage(join(__dirname, 'assets', 'icon', 'iconWithMsg.png'))
        } else {
          log.info('Setting tray icon to normal')
          // whatsUpp.tray.setImage(__dirname + '/assets/icon/icon.png')
          whatsUpp.tray.setImage(join(__dirname, 'assets', 'icon', 'icon.png'))
        }
        log.info('Mask value: ' + global.whatsUpp.iconStatus)
      }
      global.whatsUpp.oldIconStatus = global.whatsUpp.iconStatus
    },

    createTray () {
      log.info('Creating tray icon')
      // var trayImg = __dirname + '/assets/img/trayTemplate.png'
      let trayImg = join(__dirname, 'assets', 'img', 'trayTemplate.png')
      // Darwin requires black/white/transparent icon, other platforms does not
      if (process.platform !== 'darwin') {
        // trayImg = __dirname + '/assets/icon/icon.png'
        trayImg = join(__dirname, 'assets', 'icon', 'icon.png')
      }
      whatsUpp.tray = new AppTray(trayImg)

      // Setting up a trayicon context menu
      whatsUpp.trayContextMenu = AppMenu.buildFromTemplate([
        {
          label: _('Show'),
          visible: config.get('startminimized'), // Hide this option on start
          click: function () {
            whatsUpp.window.show()
            whatsUpp.window.setAlwaysOnTop(true)
            whatsUpp.window.focus()
            whatsUpp.window.setAlwaysOnTop(false)
          }
        },

        {
          label: _('Hide'),
          visible: !config.get('startminimized'), // Show this option on start
          click: function () {
            whatsUpp.window.hide()
          }
        },

        // Quit WhatsUpp
        {
          label: _('Quit'),
          click: function () {
            app.quit()
          }
        }
      ])
      whatsUpp.tray.setContextMenu(whatsUpp.trayContextMenu)

      // Normal this will show the main window, but electron under Linux
      // dosent work with the clicked event so we are using the above
      // contextmenu insted - Rightclick the trayicon and pick Show
      // WhatsUpp
      // More info:
      // https://github.com/electron/electron/blob/master/docs/api/tray.md
      // See the Platform limitations section.
      whatsUpp.tray.on('clicked', () => {
        whatsUpp.window.show()
        whatsUpp.window.setAlwaysOnTop(true)
        whatsUpp.window.focus()
        whatsUpp.window.setAlwaysOnTop(false)
      })
      whatsUpp.tray.on('click', () => {
        whatsUpp.window.show()
        whatsUpp.window.setAlwaysOnTop(true)
        whatsUpp.window.focus()
        whatsUpp.window.setAlwaysOnTop(false)
      })

      whatsUpp.tray.setToolTip('WhatsUpp')
    },

    clearCache () {
      log.info('Clearing cache')
      try {
        // fileSystem.unlinkSync(app.getPath('userData') + '/Application Cache/Index');
        fileSystem.removeSync(app.getPath('userData') + '/Service Worker/')
      } catch (e) {
        log.warn('Error clearing cache: ' + e)
      }
    },

    openWindow () {
      log.info('Open main window')
      whatsUpp.window = new BrowserWindow({
        y: config.get('posY'),
        x: config.get('posX'),
        width: config.get('width'),
        height: config.get('height'),
        minWidth: 600,
        minHeight: 600,
        // "type": "toolbar",
        title: 'WhatsUpp',
        show: false,
        autoHideMenuBar: config.get('autoHideMenuBar') === true,
        // 'icon': __dirname + '/assets/icon/icon.png',
        icon: join(__dirname, 'assets', 'icon', 'icon.png'),
        webPreferences: {
          nodeIntegration: false,
          preload: join(__dirname, 'js', 'injected.js')
        }
      })

      ContextMenu({
        window: whatsUpp.window
      })

      whatsUpp.window.loadURL('https://web.whatsapp.com')

      whatsUpp.window.webContents.on('did-finish-load', function () {
        if (groupLinkOpenRequested != null) {
          whatsUpp.window.webContents.executeJavaScript(
            "var el = document.createElement('a');" +
            'el.href = "' + groupLinkOpenRequested + '";' +
            'el.style.display = "none";' +
            "el.rel = 'noopener noreferrer';" +
            "el.id = 'newlink';" +
            'document.body.appendChild(el);' +
            "setTimeout(function() { var el = document.getElementById('newlink'); el.click(); document.body.removeChild(el); }, 500);"
          )
        }
        // Checking for new version
        const ep = pjson.releases
        log.info('Checking for new versions (current version ' + pjson.version + ')')
        const ua = AppSession.defaultSession.getUserAgent()
        request.get({ url: ep, headers: { 'User-Agent': ua } }, function (err, response, body) {
          if (!err && response !== undefined && response.statusCode === 200) {
            const ghinfo = JSON.parse(body)
            const versions = []
            let verregexp = null

            if (pjson.reltype === 'stable') {
              verregexp = /^\d+\.\d+\.\d+/
            } else if (pjson.reltype === 'dev') {
              verregexp = /^\d{8,}/
            }

            for (let kk = 0; kk < ghinfo.length; kk++) {
              if (ghinfo[kk].name.match(verregexp)) {
                versions.push(ghinfo[kk].name)
              }
            }

            if (!versions.length) { versions.push('') }
            global.whatsUpp.newVersion = versions[0]
            if (whatsUpp.newVersion.localeCompare(pjson.version) === 1) {
              log.info('A new version is available: ' + whatsUpp.newVersion)
              const options = {
                title: pjson.productName,
                message: 'A new version is available, download it at https://github.com/alindt/WhatsUpp',
                open: 'https://github.com/alindt/WhatsUpp/releases/latest',
                sound: true
              }
              notifier.notify(options, function (err, response) {
                if (err) log.warn('Error: ' + err)
              })
            } else {
              log.info('Already on latest version')
            }
          } else {
            log.warn('Error while checking for updates (status ' + (response !== undefined ? response.statusCode : ' not available') + '): ' + err)
          }
        })
      })

      if (config.get('startminimized') !== true) {
        whatsUpp.window.show()
      }

      whatsUpp.window.on('move', (e, evt) => {
        config.set('posX', whatsUpp.window.getBounds().x)
        config.set('posY', whatsUpp.window.getBounds().y)
        config.set('width', whatsUpp.window.getBounds().width)
        config.set('height', whatsUpp.window.getBounds().height)
        config.saveConfiguration()
      })

      whatsUpp.window.on('resize', (e, evt) => {
        config.set('posX', whatsUpp.window.getBounds().x)
        config.set('posY', whatsUpp.window.getBounds().y)
        config.set('width', whatsUpp.window.getBounds().width)
        config.set('height', whatsUpp.window.getBounds().height)
        config.saveConfiguration()
      })

      whatsUpp.window.on('page-title-updated', onlyOSX((event, title) => {
        let count = title.match(/\((\d+)\)/)
        count = count ? count[1] : ''
        app.dock.setBadge(count)
        log.info('Badge updated: ' + count)
      }))

      whatsUpp.window.on('page-title-updated', onlyLinux((event, title) => {
        let count = title.match(/\((\d+)\)/)
        count = count ? count[1] : ''

        if (parseInt(count) > 0) {
          if (!whatsUpp.window.isFocused() && global.config.get('quietMode') !== true) {
            log.info('Flashing frame')
            whatsUpp.window.flashFrame(true)
          }
          const badge = NativeImage.createFromPath(app.getAppPath() + '/assets/badges/badge-' + (count > 9 ? 0 : count) + '.png')
          whatsUpp.window.setOverlayIcon(badge, 'new messages')
          global.whatsUpp.setNewMessageIcon()
        } else {
          whatsUpp.window.setOverlayIcon(null, 'no new messages')
          global.whatsUpp.clearNewMessageIcon()
        }
        log.info('Badge updated: ' + count)
      }))

      whatsUpp.window.on('page-title-updated', onlyWin((event, title) => {
        let count = title.match(/\((\d+)\)/)
        count = count ? count[1] : ''

        if (parseInt(count) > 0) {
          if (!whatsUpp.window.isFocused()) {
            whatsUpp.window.flashFrame(true)
          }
          const badge = NativeImage.createFromPath(app.getAppPath() + '/assets/badges/badge-' + (count > 9 ? 0 : count) + '.png')
          whatsUpp.window.setOverlayIcon(badge, 'new messages')
          global.whatsUpp.setNewMessageIcon()
        } else {
          whatsUpp.window.setOverlayIcon(null, 'no new messages')
          global.whatsUpp.clearNewMessageIcon()
        }
        log.info('Badge updated: ' + count)
      }))

      whatsUpp.window.webContents.on('new-window', (e, url) => {
        require('electron').shell.openExternal(url)
        e.preventDefault()
      })

      whatsUpp.window.on('close', onlyOSX((e) => {
        if (whatsUpp.window.forceClose !== true) {
          e.preventDefault()
          whatsUpp.window.hide()
        }
      }))

      whatsUpp.window.on('close', onlyWin((e) => {
        if (whatsUpp.tray === undefined) {
          app.quit()
        } else if (whatsUpp.window.forceClose !== true) {
          e.preventDefault()
          whatsUpp.window.hide()
        }
      }))

      whatsUpp.window.on('close', onlyLinux((e) => {
        if (whatsUpp.tray === undefined) {
          app.quit()
        } else if (whatsUpp.window.forceClose !== true) {
          e.preventDefault()
          whatsUpp.window.hide()
        }
      }))

      whatsUpp.window.on('close', function () {
        if (settings.window) {
          settings.window.close()
          settings.window = null
        }
      })

      // Toggle contextmenu content when window is shown
      whatsUpp.window.on('show', function () {
        if (whatsUpp.tray !== undefined) {
          whatsUpp.trayContextMenu.items[0].visible = false
          whatsUpp.trayContextMenu.items[1].visible = true

          // Need to re-set the contextmenu for this to work under Linux
          // TODO: Only trigger this under Linux
          whatsUpp.tray.setContextMenu(whatsUpp.trayContextMenu)
        }
      })

      // Toggle contextmenu content when window is hidden
      whatsUpp.window.on('hide', function () {
        if (whatsUpp.tray !== undefined) {
          whatsUpp.trayContextMenu.items[0].visible = true
          whatsUpp.trayContextMenu.items[1].visible = false

          // Need to re-set the contextmenu for this to work under Linux
          // TODO: Only trigger this under Linux
          whatsUpp.tray.setContextMenu(whatsUpp.trayContextMenu)
        }
      })

      app.on('before-quit', onlyOSX(() => {
        whatsUpp.window.forceClose = true
      }))

      app.on('before-quit', onlyLinux(() => {
        whatsUpp.window.forceClose = true
      }))

      app.on('before-quit', onlyWin(() => {
        whatsUpp.window.forceClose = true
      }))

      app.on('window-all-closed', onlyWin(() => {
        app.quit()
      }))
    }
  }

  global.settings = {
    init () {
      // if there is already one instance of the window created show that one
      if (settings.window) {
        settings.window.show()
      } else {
        settings.openWindow()
        settings.createMenu()
      }
    },

    createMenu () {
      settings.menu = new AppMenu()
      settings.menu.append(new MenuItem(
        {
          label: 'close',
          visible: false,
          accelerator: 'esc',
          click () { settings.window.close() }
        })
      )
      settings.menu.append(new MenuItem(
        {
          label: 'Toggle DevTools',
          accelerator: 'Ctrl+Shift+I',
          visible: false,
          click () { settings.window.toggleDevTools() }
        })
      )
      settings.menu.append(new MenuItem(
        {
          label: 'Reload settings view',
          accelerator: 'CmdOrCtrl+r',
          visible: false,
          click () { settings.window.reload() }
        })
      )
      settings.window.setMenu(settings.menu)
      settings.window.setMenuBarVisibility(false)
    },

    openWindow () {
      settings.window = new BrowserWindow(
        {
          width: 550,
          height: 550,
          resizable: true,
          center: true,
          frame: true,
          webPreferences: {
            nodeIntegration: true
          }
        }
      )

      // settings.window.loadURL('file://' + __dirname + '/html/settings.html')
      settings.window.loadURL('file://' + join(__dirname, 'html', 'settings.html'))
      settings.window.show()

      settings.window.on('close', () => {
        settings.window = null
      })
    }
  }

  global.pjson = pjson
  global.about = {
    init () {
      // if there is already one instance of the window created show that one
      if (about.window) {
        about.window.show()
      } else {
        about.openWindow()
        about.createMenu()
      }
    },

    createMenu () {
      about.menu = new AppMenu()
      about.menu.append(new MenuItem(
        {
          label: 'close',
          visible: false,
          accelerator: 'esc',
          click () { about.window.close() }
        })
      )
      about.menu.append(new MenuItem(
        {
          label: 'Toggle DevTools',
          accelerator: 'Ctrl+Shift+I',
          visible: false,
          click () { about.window.toggleDevTools() }
        })
      )
      about.menu.append(new MenuItem(
        {
          label: 'Reload settings view',
          accelerator: 'CmdOrCtrl+r',
          visible: false,
          click () { about.window.reload() }
        })
      )
      about.window.setMenu(about.menu)
      about.window.setMenuBarVisibility(false)
    },

    openWindow () {
      about.window = new BrowserWindow(
        {
          width: 600,
          height: 450,
          resizable: true,
          center: true,
          frame: true,
          webPreferences: {
            nodeIntegration: true
          }
        }
      )

      // about.window.loadURL('file://' + __dirname + '/html/about.html')
      about.window.loadURL('file://' + join(__dirname, 'html', 'about.html'))
      about.window.show()
      about.window.webContents.on('new-window', (e, url) => {
        require('electron').shell.openExternal(url)
        e.preventDefault()
      })

      about.window.on('close', () => {
        about.window = null
      })
    }
  }

  const { ipcMain } = require('electron')
  ipcMain.on('phoneinfoupdate', (event, arg) => {
    global.phoneinfo.infos = arg
    if (arg.info !== 'NORMAL') {
      global.whatsUpp.setWarningTray()
    } else {
      global.whatsUpp.setNormalTray()
    }
  })
  ipcMain.on('notificationClick', (event, arg) => {
    global.whatsUpp.window.show()
    global.whatsUpp.window.setAlwaysOnTop(true)
    global.whatsUpp.window.focus()
    global.whatsUpp.window.setAlwaysOnTop(false)
  })

  global.phoneinfo = {
    init () {
      // if there is already one instance of the window created show that one
      if (phoneinfo.window) {
        phoneinfo.window.show()
      } else {
        phoneinfo.openWindow()
        phoneinfo.createMenu()
      }
    },

    createMenu () {
      phoneinfo.menu = new AppMenu()
      phoneinfo.menu.append(new MenuItem(
        {
          label: 'close',
          visible: false,
          accelerator: 'esc',
          click () { phoneinfo.window.close() }
        })
      )
      phoneinfo.menu.append(new MenuItem(
        {
          label: 'Reload phoneinfo view',
          accelerator: 'CmdOrCtrl+r',
          visible: false,
          click () { phoneinfo.window.reload() }
        })
      )
      phoneinfo.menu.append(new MenuItem({
        label: 'Toggle Developer Tools',
        accelerator: (function () {
          if (process.platform === 'darwin') { return 'Alt+Command+I' } else { return 'Ctrl+Shift+I' }
        })(),
        click: function (item, focusedWindow) {
          if (focusedWindow) { focusedWindow.toggleDevTools() }
        }
      }))
      phoneinfo.window.setMenu(phoneinfo.menu)
      phoneinfo.window.setMenuBarVisibility(false)
    },

    openWindow () {
      phoneinfo.window = new BrowserWindow(
        {
          width: 500,
          height: 500,
          resizable: true,
          center: true,
          frame: true,
          webPreferences: {
            nodeIntegration: true
          }
        }
      )

      // phoneinfo.window.loadURL('file://' + __dirname + '/html/phoneinfo.html')
      phoneinfo.window.loadURL('file://' + join(__dirname, 'html', 'phoneinfo.html'))
      phoneinfo.window.show()

      phoneinfo.window.on('close', () => {
        phoneinfo.window = null
      })
    }
  }

  app.on('ready', () => {
    // Cleanup UA string for "conformity"...
    const r = new RegExp(' (' + pjson.name + '|electron)/[^\\s]+', 'gi')
    const ua = AppSession.defaultSession.getUserAgent().replace(r, '')
    AppSession.defaultSession.setUserAgent(ua)

    if (config.get('useProxy')) {
      const proxyType = config.get('proxyType')
      const proxyURI = config.get('proxyURI')
      const proxy = proxyType + '://' + proxyURI
      log.info('Proxy configured: ' + proxy)
      AppSession.defaultSession.setProxy({ proxyRules: proxy }, function () {})
    } else {
      log.info('No proxy')
    }

    whatsUpp.init()
    // setting of globalShortcut
    if (config.get('globalshortcut') === true) {
      globalShortcut.register('CmdOrCtrl + Alt + W', function () {
        if (whatsUpp.window.isFocused()) { whatsUpp.window.hide() } else { whatsUpp.window.show() }
      })
    }
  })

  // unregistering the globalShorcut on quit of application
  app.on('will-quit', function () {
    if (config.get('globalshortcut') === true) {
      globalShortcut.unregisterAll()
    }
  })
})(this)
