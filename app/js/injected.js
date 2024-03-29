// vim: set ts=2 sw=2 expandtab:
/* global MutationObserver, Notification */

(function () {
  const { ipcRenderer } = require('electron')
  const { remote } = require('electron')
  let updatePhoneInfoInterval = null

  function updatePhoneInfo () {
    if (window.Store === undefined || window.Store.Conn === undefined) {
      return
    }
    ipcRenderer.send('phoneinfoupdate', {
      info: window.Store.Stream.info,
      me: '+' + window.Store.Conn.me.split('@')[0],
      battery: window.Store.Conn.battery,
      plugged: window.Store.Conn.plugged,
      platform: window.Store.Conn.platform,
      phoneActive: window.Store.Stream.phoneActive,
      phone: {
        manufacturer: window.Store.Conn.phone.device_manufacturer,
        model: window.Store.Conn.phone.device_model,
        mcc: window.Store.Conn.phone.mcc,
        mnc: window.Store.Conn.phone.mnc,
        os_build_number: window.Store.Conn.phone.os_build_number,
        os_version: window.Store.Conn.phone.os_version,
        wa_version: window.Store.Conn.phone.wa_version
      }
    })
    if (updatePhoneInfoInterval != null) {
      clearInterval(updatePhoneInfoInterval)
      updatePhoneInfoInterval = null
      setInterval(updatePhoneInfo, 2000)
    }
  }

  console.log('Waiting for DOMContentLoaded')
  document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded event')
    updatePhoneInfoInterval = setInterval(updatePhoneInfo, 500)

    // pass in the target node, as well as the observer options
    var observer = new MutationObserver(function (mutations) {
      console.log('Mutations occurred: ', mutations.length)
      // document.querySelector('div[data-asset-chat-background]').classList.add('pane-chat-tile')

      if (remote.getGlobal('config').currentSettings.darkMode) {
        const elements = document.getElementsByTagName('path')
        for (let i = 0; i < elements.length; i++) {
          elements[i].setAttribute('fill', 'white')
        }
      }

      const inputSearch = document.querySelector('input[type="text"][title="Search or start new chat"]')
      if (inputSearch) {
        console.log('Adding event listeners')

        document.addEventListener('keydown', function (event) {
          // ctrl+f focuses on search input.
          if (event.ctrlKey && event.key === 'f') { inputSearch.focus() }
        })

        console.log('Disconnecting the observer')
        observer.disconnect()
      }
    })

    const config = { childList: true, subtree: true }
    observer.observe(document.querySelector('body'), config)
  }, false)

  setInterval(function () {
    Array.from(document.querySelectorAll('audio')).map(function (audio) {
      audio.playbackRate = (window.audioRate || 1)
    })
    if (window.audioRate) {
      Array.from(document.querySelectorAll('.meta-audio *:first-child')).map(function (span) {
        span.innerHTML = window.audioRate.toFixed(1) + 'x&nbsp;'
      })
    }
  }, 200)

  let NativeNotification = Notification
  // Notification = function (title, options) {
  NativeNotification = function (title, options) {
    if (remote.getGlobal('config').currentSettings.quietMode) {
      return
    }
    const notification = new NativeNotification(title, options)

    notification.addEventListener('click', function () {
      ipcRenderer.send('notificationClick')
    })

    return notification
  }

  Notification.prototype = NativeNotification.prototype
  Notification.permission = NativeNotification.permission
  Notification.requestPermission = NativeNotification.requestPermission.bind(Notification)
})()
