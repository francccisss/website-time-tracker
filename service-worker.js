chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(
	async ({ track }, sender, sendResponse) => {
		const storage = await chrome.storage.local.get(["trackedSites"]);
		const [{ url, title }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});

		console.log(url);
		const currentActiveTab = storage.trackedSites.find(
			(site) => site.url === new URL(url).hostname
		);

		// only checking the length but not checking if the current active tab exists
		if (track && currentActiveTab !== undefined) {
			console.log(currentActiveTab);
			const updateCurrentTab = {
				...currentActiveTab,
				isTracked: currentActiveTab.isTracked ? false : true,
				timesVisited: currentActiveTab.timesVisited + 1,
				time: {
					...currentActiveTab.time,
					currentTrackedTime: new Date(),
				},
			};
			const filterSites = storage.trackedSites.filter(
				(s) => s.url !== currentActiveTab.url
			);
			await chrome.storage.local.set({
				trackedSites: [updateCurrentTab, ...filterSites],
			});
		} else if (track && currentActiveTab === undefined) {
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
				trackedSites: [createCurrentTabData, ...storage.trackedSites],
			});
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
		console.log(tab.url);
		console.log("completed");
		const currentActiveTab = trackedSites.find((site) =>
			site.url.includes(new URL(tab.url).hostname)
		);
		if (currentActiveTab !== undefined) {
			console.log(currentActiveTab);
			if (currentActiveTab.isTracked) {
				console.log("is tracked");
			} else {
				console.log("is not being tracked");
			}
		} else {
			console.log("doesnt exist");
		}
	}
});

chrome.tabs.onRemoved.addListener((tabIda, removeInfo) => {
	console.log("tab removed");
});
