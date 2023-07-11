export async function displayCurrentTab() {
  const [{ url }] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const slideBtn = document.getElementById("slide-btn");
  const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
  const currentActiveTab = trackedSites.find(
    (site) => site.url === new URL(url).hostname
  );
  const header = document.getElementById("website-title");
  const metrics = document.querySelectorAll(".metric-data");
  let headerText = new URL(url).host.split(".")[1];
  let formatHeaderText = headerText.replace(
    headerText[0],
    headerText.charAt(0).toUpperCase()
  );
  header.textContent = formatHeaderText;

  if (currentActiveTab !== undefined) {
    console.log(currentActiveTab);
    const { data } = formatMetricData({
      time: currentActiveTab.time,
      visits: currentActiveTab.timesVisited,
    });
    metrics.forEach((metric, i) => {
      metric.textContent = Math.floor(data[i]);
    });
    currentActiveTab.isTracked &&
      slideBtn.classList.replace("isNotTracked", "isTracked");
  }
}

function formatMetricData({
  time: { currentTrackedTime, initialTrackedTime },
  visits,
}) {
  let formattedData;
  if (visits !== undefined) {
    formattedData = [
      // wrong everytime a user clicks on popup action it calculates the total time between initial and current time
      // instead of accumulating every visit and exit to total time totalTime = n(fromVisitTime - onExitTime)
      (currentTrackedTime - initialTrackedTime) / 3600000,
      visits,
      // wrong this needs the get the daily reset and accumulate the same way as from totalTime
      // dailySpent = n(fromVisitTime - onExitTime)
      (Date.now() - currentTrackedTime) / 3600000,
    ];
  }
  return {
    data: formattedData,
  };
}

export function animateSlideButton(e) {
  e.preventDefault();
  let target = e.target;
  if (target.classList.contains("isNotTracked")) {
    return target.classList.replace("isNotTracked", "isTracked");
  }
  target.classList.replace("isTracked", "isNotTracked");
}
