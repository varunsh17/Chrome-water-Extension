const statusDiv = document.getElementById("status");
const input = document.getElementById("num");
const labelInput = document.getElementById("label");
const button = document.getElementById("add");
const pauseBtn = document.getElementById("pause");
const reminderListDiv = document.getElementById("reminderList");
const reminderCountDiv = document.getElementById("reminderCount");
const snoozeInfoDiv = document.getElementById("snoozeInfo");

function showStatus(msg, type = "info") {
  statusDiv.textContent = msg;
  statusDiv.style.color = type === "error" ? "red" : "limegreen";
}

function updatePauseButton(paused) {
  pauseBtn.textContent = paused ? "Resume" : "Pause";
}

function addReminder() {
  const minutes = parseInt(input.value);
  const label = labelInput.value.trim() || "Reminder";
  if (isNaN(minutes) || minutes <= 0) {
    showStatus("Enter a valid interval (min > 0).", "error");
    return;
  }
  chrome.storage.local.get({ reminders: [] }, (data) => {
    const reminders = data.reminders;
    const id = Date.now().toString();
    reminders.push({ id, label, minutes });
    chrome.storage.local.set({ reminders }, () => {
      chrome.runtime.sendMessage({ addReminder: { id, label, minutes } });
      showStatus(`Added: ${label} (${minutes} min)`);
      input.value = "";
      labelInput.value = "";
      renderReminders();
    });
  });
}

function removeReminder(id) {
  chrome.storage.local.get({ reminders: [] }, (data) => {
    const reminders = data.reminders.filter((r) => r.id !== id);
    chrome.storage.local.set({ reminders }, () => {
      chrome.runtime.sendMessage({ removeReminder: id });
      showStatus("Reminder removed.");
      renderReminders();
    });
  });
}

function renderReminders() {
  chrome.storage.local.get({ reminders: [] }, (data) => {
    reminderListDiv.innerHTML = "";
    if (data.reminders.length === 0) {
      reminderListDiv.innerHTML = "<em>No reminders set.</em>";
      return;
    }
    data.reminders.forEach((reminder) => {
      const div = document.createElement("div");
      div.className = "reminder-item";
      div.innerHTML = `
        <span>${reminder.label} (${reminder.minutes} min)</span>
        <button data-id="${reminder.id}" class="removeBtn">Remove</button>
      `;
      reminderListDiv.appendChild(div);
    });
    document.querySelectorAll(".removeBtn").forEach((btn) => {
      btn.onclick = () => removeReminder(btn.getAttribute("data-id"));
    });
  });
}

function togglePause() {
  chrome.storage.local.get("paused", (data) => {
    const paused = !data.paused;
    chrome.storage.local.set({ paused }, () => {
      updatePauseButton(paused);
      chrome.runtime.sendMessage({ pauseToggle: paused });
      showStatus(paused ? "Reminders paused." : "Reminders resumed.");
    });
  });
}

function updateReminderCount() {
  chrome.storage.local.get(["remindersSentToday"], (data) => {
    reminderCountDiv.textContent =
      "Reminders sent today: " + (data.remindersSentToday || 0);
  });
}

function updateSnoozeInfo() {
  chrome.storage.local.get(["snoozedUntil"], (data) => {
    if (data.snoozedUntil && Date.now() < data.snoozedUntil) {
      const mins = Math.ceil((data.snoozedUntil - Date.now()) / 60000);
      snoozeInfoDiv.textContent = `Snoozed for ${mins} more minute(s).`;
    } else {
      snoozeInfoDiv.textContent = "";
    }
  });
}

// Load reminders, pause state, etc.
chrome.storage.local.get(["paused"], (data) => {
  updatePauseButton(data.paused);
  renderReminders();
  updateReminderCount();
  updateSnoozeInfo();
});

button.addEventListener("click", addReminder);
pauseBtn.addEventListener("click", togglePause);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.updateReminderCount) updateReminderCount();
  if (msg.updateSnoozeInfo) updateSnoozeInfo();
  if (msg.refreshReminders) renderReminders();
});
