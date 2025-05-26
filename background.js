// Helper to create all alarms
function createAllAlarms(reminders) {
  chrome.alarms.clearAll(() => {
    reminders.forEach((reminder) => {
      chrome.alarms.create(reminder.id, { periodInMinutes: reminder.minutes });
    });
  });
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(["reminders", "paused", "snoozedUntil"], (data) => {
    if (data.paused) return;
    if (data.snoozedUntil && Date.now() < data.snoozedUntil) return;
    const reminder = (data.reminders || []).find((r) => r.id === alarm.name);
    if (!reminder) return;

    // Count reminders sent today
    const today = new Date().toISOString().slice(0, 10);
    chrome.storage.local.get(["remindersSentToday", "reminderDate"], (d) => {
      let reminders = d.remindersSentToday || 0;
      let date = d.reminderDate || "";
      if (date !== today) reminders = 0;
      reminders++;
      chrome.storage.local.set({
        remindersSentToday: reminders,
        reminderDate: today,
      });
      chrome.runtime.sendMessage({ updateReminderCount: true });
    });

    chrome.notifications.create(
      reminder.id,
      {
        type: "basic",
        iconUrl: "128.png",
        title: reminder.label,
        message: `Time for your "${reminder.label}" reminder!`,
        buttons: [{ title: "Snooze 5 min" }],
      },
      () => {
        setTimeout(() => {
          chrome.notifications.clear(reminder.id);
        }, 5000);
      }
    );
  });
});

// Handle snooze button click
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) {
    const snoozeUntil = Date.now() + 5 * 60 * 1000;
    chrome.storage.local.set({ snoozedUntil: snoozeUntil }, () => {
      chrome.runtime.sendMessage({ updateSnoozeInfo: true });
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.addReminder) {
    chrome.storage.local.get({ reminders: [] }, (data) => {
      createAllAlarms(data.reminders.concat([request.addReminder]));
      chrome.runtime.sendMessage({ refreshReminders: true });
    });
    sendResponse({ success: true });
  } else if (request.removeReminder) {
    chrome.storage.local.get({ reminders: [] }, (data) => {
      const reminders = data.reminders.filter(
        (r) => r.id !== request.removeReminder
      );
      createAllAlarms(reminders);
      chrome.runtime.sendMessage({ refreshReminders: true });
    });
    sendResponse({ success: true });
  } else if (typeof request.pauseToggle === "boolean") {
    if (request.pauseToggle) {
      chrome.alarms.clearAll();
    } else {
      chrome.storage.local.get({ reminders: [] }, (data) => {
        createAllAlarms(data.reminders || []);
      });
    }
    sendResponse({ success: true });
  }
  return true;
});
