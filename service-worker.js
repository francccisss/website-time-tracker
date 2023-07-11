chrome.runtime.onInstalled.addListener(({ reason }) => {
  reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(async ({ track }) => {
  if (track) {
    const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
    const [{ url, title, favIconUrl }] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    const currentActiveTab = trackedSites.find(
      (site) => site.url === new URL(url).hostname
    );
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
          initialTrackedTime: currentTime,
          currentTrackedTime: currentTime,
        },
      };
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

// need to listen to different events and inject script to tabs that is currently active
// injects on every tabs that were active and establishes a connection
chrome.history.onVisited.addListener(async () => {
  const [{ id }] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: id },
      files: ["./content-script/connection.js"],
    });
    console.log("successfully injected");
  } catch (err) {
    console.log("unable to inject script");
  }
});

chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name === "connect") {
    console.log("connected");
    port.onDisconnect.addListener(() => {
      console.log("disconnected");
    });
  }
});

chrome.history.onVisited.addListener(async ({ url }) => {
  const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
  const currentActiveTab = trackedSites.find((site) =>
    site.url.includes(new URL(url).hostname)
  );
  if (currentActiveTab !== undefined) {
    const currentTime = Date.now();
    const updateTrackedSites = trackedSites.map((site) => {
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
    });
    await chrome.storage.local.set({
      trackedSites: updateTrackedSites,
    });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log("tab removed");
});
