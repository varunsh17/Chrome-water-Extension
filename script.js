const statusDiv = document.getElementById("status");
const input = document.getElementById("num");
const button = document.getElementById("add");

function showStatus(msg, type = "info") {
  statusDiv.textContent = msg;
  statusDiv.style.color = type === "error" ? "red" : "limegreen";
}

function remind() {
  const minutes = parseInt(input.value);
  if (isNaN(minutes) || minutes <= 0) {
    showStatus("Please enter a valid number greater than 0.", "error");
    return;
  }
  showStatus("Setting reminder...");
  chrome.runtime.sendMessage({ minutes }, function (response) {
    if (chrome.runtime.lastError) {
      showStatus(
        "Extension error: " + chrome.runtime.lastError.message,
        "error"
      );
      return;
    }
    if (response && response.success) {
      showStatus(`Alarm set for every ${minutes} minute(s).`);
      chrome.storage.local.set({ lastMinutes: minutes });
    } else {
      showStatus(
        "Failed to set alarm: " + (response?.error || "Unknown error"),
        "error"
      );
    }
  });
}

// Load last used interval
chrome.storage.local.get("lastMinutes", (data) => {
  if (data.lastMinutes) {
    input.value = data.lastMinutes;
    showStatus(`Current interval: ${data.lastMinutes} minute(s).`);
  }
});

button.addEventListener("click", remind);
