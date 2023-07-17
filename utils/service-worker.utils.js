export async function getCurrentActiveTab(url) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	return currentActiveTab;
}

// problem with facebook reels and shit
export async function updateTrackedTabsOnDeleted(currentActiveTab) {
	const currentTime = Date.now();
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	await chrome.storage.local.set({
		trackedSites: trackedSites.map((site) => {
			if (site.url === currentActiveTab.url) {
				const updatedActiveTab = {
					...currentActiveTab,
					time: {
						...site.time,
						totalTimeSpent:
							site.time.totalTimeSpent +
							(currentTime - site.time.currentTrackedTime),
						dailyTimeSpent: 20,
					},
				};
				console.log(updatedActiveTab);
				return updatedActiveTab;
			}
			return site;
		}),
	});
}

export async function loadCurrentActiveTrackedTab(currentActiveTab) {
	const currentTime = Date.now();
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
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
			}
			return site;
		}),
	});
}
