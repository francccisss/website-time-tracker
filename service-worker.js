import { getCurrentActiveTab } from "./utils/service-worker.utils.js";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(async ({ track }) => {
  if (track) {
    const [{ url, title, favIconUrl }] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const currentActiveTab = await getCurrentActiveTab(url);
    const currentTime = Date.now();
    if (currentActiveTab !== undefined) {
      const updateTrackedSites = trackedSites.map((site) => {
        if (site.url.includes(currentActiveTab.url)) {
          const updateCurrentTab = {
            ...site,
            isTracked: site.isTracked ? false : true,
            timesVisited: site.timesVisited + 1,
            time: {
              ...site.time,
              currentTrackedTime: currentTime,
            },
          };
          return updateCurrentTab;
        }
        return site;
      });
      await chrome.storage.local.set({
        trackedSites: updateTrackedSites,
      });
    } else if (currentActiveTab === undefined) {
      const createCurrentTabData = {
        url: new URL(url).hostname,
        title,
        favIconUrl,
        isTracked: true,
        timesVisited: 0,
        time: {
          currentTrackedTime: currentTime,
          totalTimeSpent: 0,
          dailyTimeSpent: 0,
        },
      };
      const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
      await chrome.storage.local.set({
        trackedSites: [createCurrentTabData, ...trackedSites],
      });
    }
  }
});

chrome.storage.onChanged.addListener(async () => {
  await chrome.storage.local.get(["trackedSites"]).then((result) => {
    console.log(result.trackedSites);
  });
});

chrome.history.onVisited.addListener(async () => {
  const [{ id }] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: id },
      files: ["/content-script/connection.js"],
    });
    console.log("successfully injected");
  } catch (err) {
    console.log("unable to inject script");
  }
});

// every time a user opens a tab of the same url `n` times,
// a connection is established for each tab with the same url,
// so when a user decides to close one tab of the same url,
// the established connection between all similar urls will
// not be disconnected until there is none left of the same url.
chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name === "connect") {
    let trackedTabUrl;
    let documentId;
    port.onMessage.addListener((msg, { sender }) => {
      console.log(msg);
      trackedTabUrl = sender.url;
      documentId = sender.documentId;
      console.log(documentId);
    });
    port.onDisconnect.addListener(async ({ sender }) => {
      console.log("disconnected");
      console.log(sender.documentId);
      const currentActiveTab = await getCurrentActiveTab(trackedTabUrl);
      if (sender.documentId === documentId && currentActiveTab !== undefined) {
        const currentTime = Date.now();
        const { trackedSites } = await chrome.storage.local.get([
          "trackedSites",
        ]);
        const updatedActiveTab = {
          ...currentActiveTab,
          time: {
            ...currentActiveTab.time,
            totalTimeSpent:
              currentActiveTab.time.totalTimeSpent +
              (currentTime - currentActiveTab.time.currentTrackedTime),
            dailyTimeSpent: 20,
          },
        };
        await chrome.storage.local.set({
          trackedSites: trackedSites.map((site) =>
            site.url === currentActiveTab.url ? updatedActiveTab : site
          ),
        });
        console.log(updatedActiveTab);
      } else {
        console.log("is not in database");
      }
    });
  }
});

// improve smelly code
chrome.history.onVisited.addListener(async ({ url }) => {
  const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
  if (trackedSites.length !== 0) {
    const currentActiveTab = await getCurrentActiveTab(url);
    if (currentActiveTab !== undefined) {
      const currentTime = Date.now();
      await chrome.storage.local.set({
        trackedSites: trackedSites.map((site) => {
          if (
            site.url.includes(currentActiveTab.url) &&
            currentActiveTab.isTracked
          ) {
            const updateCurrentTab = {
              ...site,
              timesVisited: site.timesVisited + 1,
              time: {
                ...site.time,
                currentTrackedTime: currentTime,
              },
            };
            return updateCurrentTab;
          } else {
            return site;
          }
        }),
      });
    }
  } else {
    console.log("tracked sites empty");
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  console.log("tab removed");
});

// need to update total time spent whenever a user reloads a tab that is currently tracked
