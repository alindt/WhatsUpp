var whatsUpp = require('electron').remote.getGlobal("whatsUpp");
var pjson = require('electron').remote.getGlobal('pjson');

$(document).ready(() => {
    $("#appversion").html(pjson["version"]);
    if (whatsUpp.newVersion == null) {
        $("#appupdates").html("Unable to verify latest version from GitHub - please close and reopen this window");
    } else if (whatsUpp.newVersion != "v"+pjson.version) {
        $("#appupdates").html("A new version is available: " + whatsUpp.newVersion + "!");
    } else if (whatsUpp.newVersion == "v"+pjson.version) {
        $("#appupdates").html("You're using latest version");
    }
});
