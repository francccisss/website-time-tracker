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
      metric.textContent = data[i];
    });
    currentActiveTab.isTracked &&
      slideBtn.classList.replace("isNotTracked", "isTracked");
  }
}

function formatMetricData({
  time: { totalTimeSpent, dailyTimeSpent },
  visits,
}) {
  console.log((totalTimeSpent / (1000 * 60 * 60)) % 24);
  let formattedData;
  if (visits !== undefined) {
    formattedData = [
      ((totalTimeSpent / (1000 * 60 * 60)) % 24).toFixed(1),
      visits,
      dailyTimeSpent,
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
