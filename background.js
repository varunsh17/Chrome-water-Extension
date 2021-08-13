let defaultDuration = 1.0
chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log(alarm)
    chrome.notifications.create("limit", {
        type: "basic",
        iconUrl: "128.png",
        title: "DRINK WATER",
        "message": "STAY HYDRATED !! Don't you wanna look fresh ?"
    }, function (notifications) {
        setTimeout(function () { chrome.notifications.clear("limit", function () { }); }, 5000);
    })
})

function createAlarm() {
    chrome.alarms.create("drink_water", { periodInMinutes: defaultDuration });
}
createAlarm()

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        defaultDuration = request.minutes * 1.0;
        console.log("Event received");

        if (defaultDuration != 0) {
            createAlarm();
            sendResponse({ sucess: true });
        }

    }
);