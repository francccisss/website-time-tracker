export async function getCurrentActiveTab(url) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	return currentActiveTab;
}

export async function updateTrackedOnDelete(currentActiveTab) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const updateCurrentTab = trackedSites.map((site) => {
		if (site.url.includes(currentActiveTab.url)) {
			console.log(site.time.currentTrackedTime);
			const currentTime = Date.now();
			const updatedActiveTab = {
				...site,
				time: {
					totalTimeSpent:
						site.time.totalTimeSpent +
						(currentTime - site.time.currentTrackedTime),
					dailyTimeSpent: 20,
					...site.time,
				},
			};
			return updatedActiveTab;
		}
		return site;
	});
	await chrome.storage.local.set({
		trackedsites: updateCurrentTab,
	});
	console.log(updateCurrentTab);
}
