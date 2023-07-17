export async function getCurrentActiveTab(url) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	return currentActiveTab;
}

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
