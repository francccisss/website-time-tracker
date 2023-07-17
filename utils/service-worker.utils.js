export async function getCurrentActiveTab(url) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	return currentActiveTab;
}

export async function updateTrackedOnDelete(currentActiveTab) {
	const currentTime = Date.now();
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	return trackedSites.map((site) => {
		if (site.url === currentActiveTab.url) {
			const updatedActiveTab = {
				...currentActiveTab,
				time: {
					totalTimeSpent:
						currentActiveTab.time.totalTimeSpent +
						(currentTime - currentActiveTab.time.currentTrackedTime),
					dailyTimeSpent: 20,
					currentTrackedTime: 0,
				},
			};
			console.log(updatedActiveTab);
			return updatedActiveTab;
		}
		return site;
	});
}
