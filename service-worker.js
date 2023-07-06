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
		const latestTab = await chrome.history.search({ text: "" });
		const { visitTime } = await chrome.history.getVisits({ url });

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
								currentTrackedTime: latestTab[0].lastVisitTime,
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
						initialTrackedTime: latestTab[0].lastVisitTime,
						currentTrackedTime: latestTab[0].lastVisitTime,
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

chrome.history.onVisited.addListener(async ({ url, lastVisitTime }) => {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	console.log(currentActiveTab);
	if (currentActiveTab !== undefined) {
		const { visitTime } = await chrome.history.getVisits({ url });
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
						currentTrackedTime: lastVisitTime,
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

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	console.log("tab removed");
});
