chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(
	async ({ track }, sender, sendResponse) => {
		const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
		const [{ url, title }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});

		console.log(url);
		const currentActiveTab = trackedSites.find(
			(site) => site.url === new URL(url).hostname
		);

		if (track) {
			if (currentActiveTab !== undefined) {
				const updateTrackedSites = trackedSites.map((site) => {
					if (site.url.includes(currentActiveTab.url)) {
						const updateCurrentTab = {
							...site,
							isTracked: site.isTracked ? false : true,
							timesVisited: site.timesVisited + 1,
							time: {
								...site.time,
								currentTrackedTime: new Date(),
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
					isTracked: true,
					timesVisited: 1,
					time: {
						initialTrackedTime: new Date(),
						currentTrackedTime: new Date(),
					},
				};
				await chrome.storage.local.set({
					trackedSites: [createCurrentTabData, ...trackedSites],
				});
			}
		}
	}
);

chrome.storage.onChanged.addListener(async () => {
	const getStorage = await chrome.storage.local
		.get(["trackedSites"])
		.then((result) => {
			console.log(result.trackedSites);
		});
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	if (changeInfo.status === "complete") {
		console.log("completed");
		const currentActiveTab = trackedSites.find((site) =>
			site.url.includes(new URL(tab.url).hostname)
		);
		if (currentActiveTab !== undefined) {
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
							currentTrackedTime: new Date(),
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
	}
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	console.log("tab removed");
});
