export async function getCurrentActiveTab(url) {
  const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
  const currentActiveTab = trackedSites.find((site) =>
    site.url.includes(new URL(url).hostname)
  );
  return currentActiveTab;
}
