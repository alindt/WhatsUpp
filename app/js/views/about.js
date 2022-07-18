/* global $ */

const whatsUpp = require('electron').remote.getGlobal('whatsUpp')
const pjson = require('electron').remote.getGlobal('pjson')

$(document).ready(() => {
  $('#appversion').html(pjson.version)
  $('#appname').html(pjson.productName)
  if (whatsUpp.newVersion === null) {
    $('#appupdates').css('color', 'red')
    $('#appupdates').html('Error while checking for updates.')
  } else if (whatsUpp.newVersion.localeCompare(pjson.version) === 1) {
    $('#appupdates').html('A new version is available: ' + whatsUpp.newVersion + '!')
  }
})
