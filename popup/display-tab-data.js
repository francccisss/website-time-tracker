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
  let metrics = document.querySelectorAll(".metric-data");
  let headerText = new URL(url).host.split(".")[1];
  let formatHeaderText = headerText.replace(
    headerText[0],
    headerText.charAt(0).toUpperCase()
  );
  header.textContent = formatHeaderText;
  console.log(url);

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
      (currentTrackedTime - initialTrackedTime) / 3600000,
      visits,
      (Date.now() - currentTrackedTime) / 3600000,
    ];
  }
  return {
    data: formattedData,
  };
}
