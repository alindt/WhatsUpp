// vim: set ts=2 sw=2 expandtab:

/* global $, _ */

var whatsUpp = require('electron').remote.getGlobal('whatsUpp')
var settings = require('electron').remote.getGlobal('settings')
var config = require('electron').remote.getGlobal('config')
// const log = require('electron-log')
// no-unused-vars:: const { dialog } = require('electron').remote

var SettingsView = {
  bindEvents () {
    // $this = this
    $('#save-button').on('click', (e) => {
      e.preventDefault()
      if ($('.invalid').length > 0) {
        return
      }
      // $this.saveSettings()
      this.saveSettings()
      settings.window.close()
    })

    $('#close-button').on('click', () => {
      settings.window.close()
    })

    $('#customThumbSizeCheck').on('change', () => {
      $('#thumb-size').toggle()
    })

    $('#useProxy').on('change', () => {
      $('#proxies').toggle()
      $('#httpProxy').prop('disabled', !($('#useProxy').is(':checked')))
      $('#httpsProxy').prop('disabled', !($('#useProxy').is(':checked')))
    })

    $('#custombackground_enable').on('change', () => {
      $('#custombackground').toggle()
    })
  },

  init () {
    document.title = _('Settings')

    $('#custombackground_enable').attr('checked', config.get('background-image') !== undefined)
    if (config.get('background-image') !== undefined) {
      $('#custombackground_file').val(config.get('background-image'))
      $('#background_opacity').val(config.get('background-opacity'))
    } else {
      $('#background_opacity').val('100')
      $('#custombackground').hide()
    }

    if (config.get('fontSize') !== undefined) {
      $('#fontSize').val(config.get('fontSize'))
    }

    $('#darkMode').attr('checked', config.get('darkMode') === true)
    $('#blurImages').attr('checked', config.get('blurImages') === true)
    $('#escCloseMainWindow').attr('checked', config.get('escCloseMainWindow') === true)
    $('#autoHideMenuBar').attr('checked', config.get('autoHideMenuBar') === true)
    $('#disablegpu').attr('checked', config.get('disablegpu') === true)
    $('#globalshortcut').attr('checked', config.get('globalshortcut') === true)
    $('#autostart').attr('checked', config.get('autostart') === true)
    $('#startminimized').attr('checked', config.get('startminimized') === true)
    $('#trayicon').attr('checked', config.get('trayicon') !== false)
    $('#avatars').attr('checked', config.get('hideAvatars'))
    $('#previews').attr('checked', config.get('hidePreviews'))

    if (config.get('thumbSize') !== undefined) {
      $('#customThumbSizeCheck').prop('checked', true)
      $('#thumb-size').show()
      $('#thumb-size').val(config.get('thumbSize'))
    } else {
      $('#customThumbSizeCheck').prop('checked', false)
      $('#thumb-size').hide()
    }

    $('#useProxy').attr('checked', config.get('useProxy'))
    if ($('#useProxy').is(':checked')) { $('#proxies').show() } else { $('#proxies').hide() }
    $('#httpProxy').val(config.get('httpProxy'))
    $('#httpsProxy').val(config.get('httpsProxy'))
    $('#httpProxy').prop('disabled', !($('#useProxy').is(':checked')))
    $('#httpsProxy').prop('disabled', !($('#useProxy').is(':checked')))

    $('#customcss_enable').attr('checked', config.get('customcss') !== undefined)
    if ($('#customcss_enable').is(':checked')) {
      $('#customcss_file').val(config.get('customcss'))
    }

    // Disable unavailable options
    if (process.platform === 'darwin') {
      $('#autostart').prop('disabled', true)
      $('#autoHideMenuBar').prop('disabled', true)
      $('#trayicon').prop('disabled', true)
      $('#trayicon').prop('checked', false)
    }

    this.bindEvents()
  },

  saveSettings () {
    if ($('#customcss_enable').is(':checked')) {
      config.set('customcss', $('#customcss_file').val())
    } else {
      config.set('customcss', undefined)
    }

    if ($('#custombackground_enable').is(':checked')) {
      config.set('background-image', $('#custombackground_file').val())
      config.set('background-opacity', $('#background_opacity').val())
    } else {
      config.set('background-image', undefined)
    }

    config.set('fontSize', $('#fontSize').val())
    config.set('darkMode', $('#darkMode').is(':checked'))
    config.set('blurImages', $('#blurImages').is(':checked'))
    config.set('escCloseMainWindow', $('#escCloseMainWindow').is(':checked'))
    config.set('autoHideMenuBar', $('#autoHideMenuBar').is(':checked'))
    config.set('disablegpu', $('#disablegpu').is(':checked'))
    config.set('globalshortcut', $('#globalshortcut').is(':checked'))
    config.set('autostart', $('#autostart').is(':checked'))
    config.set('startminimized', $('#startminimized').is(':checked'))
    config.set('hideAvatars', $('#avatars').is(':checked'))
    config.set('hidePreviews', $('#previews').is(':checked'))
    config.set('thumbSize', parseInt($('#thumb-size').val(), 10))
    config.set('trayicon', $('#trayicon').is(':checked'))

    if ($('#customThumbSizeCheck').is(':checked')) {
      config.set('thumbSize', $('#thumb-size').val())
    } else {
      config.unSet('thumbSize')
    }

    if ($('#useProxy').is(':checked')) {
      config.set('useProxy', $('#useProxy').is(':checked'))
      config.set('httpProxy', $('#httpProxy').val())
      config.set('httpsProxy', $('#httpsProxy').val())
    } else {
      config.unSet('useProxy')
      config.unSet('httpProxy')
      config.unSet('httpsProxy')
    }

    config.saveConfiguration()
    config.applyConfiguration()

    // Remove ServiceWorker to allow reloading
    //        whatsUpp.clearCache();
    whatsUpp.window.webContents.unregisterServiceWorker(function () { return true })

    whatsUpp.window.reload()
  }
}

/* no-unused-vars
function chooseCustomCSS () {
  if ($('#customcss_enable').is(':checked')) {
    dialog.showOpenDialog(function (fileNames) {
      if (fileNames === undefined || fileNames.length === 0) {
        $('#customcss_enable').removeAttr('checked')
        return
      }
      $('#customcss_file').val(fileNames[0])
    })
  } else {
    $('#customcss_file').val('')
  }
}
*/

/* no-unused-vars
function chooseChatBackground () {
  if ($('#custombackground_enable').is(':checked')) {
    dialog.showOpenDialog(function (fileNames) {
      if (fileNames === undefined || fileNames.length === 0) {
        $('#custombackground_enable').removeAttr('checked')
        return
      }
      if (fileNames[0].endsWith('.jpg') || fileNames[0].endsWith('.jpeg') ||
                fileNames[0].endsWith('.png') ||
                fileNames[0].endsWith('.gif')) {
        $('#custombackground_file').val(fileNames[0])
      } else {
        alert(_('Please choose a JPEG or PNG file'))
        $('#custombackground_enable').removeAttr('checked')
      }
    })
  } else {
    $('#custombackground_file').val('')
  }
}
*/

$(document).ready(() => {
  SettingsView.init()
})
