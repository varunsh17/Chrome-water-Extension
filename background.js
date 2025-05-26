// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
  chrome.notifications.create(
    "limit",
    {
      type: "basic",
      iconUrl: "128.png",
      title: "DRINK WATER",
      message: "STAY HYDRATED !! Don't you wanna look fresh?",
    },
    () => {
      setTimeout(() => {
        chrome.notifications.clear("limit");
      }, 5000);
    }
  );
});

// Create an alarm
function createAlarm(duration) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create("drink_water", { periodInMinutes: duration });
    chrome.storage.local.set({ lastMinutes: duration });
    console.log("Alarm created with duration:", duration);
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.minutes && request.minutes > 0) {
    createAlarm(request.minutes);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: "Invalid duration" });
  }
  return true; // Needed for async sendResponse
});
