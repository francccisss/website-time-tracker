chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.track) {
		const [{ url, title }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		const currentActiveTab = {
			url,
			title,
			isTracked: true,
			timesVisited: 1,
			time: {
				initialTrackedTime: new Date(),
				currentTrackedTime: new Date(),
			},
		};
		console.log({ url, title });
		const storage = await chrome.storage.local.get(["trackedSites"]);
		console.log(storage);
		await chrome.storage.local.set({
			trackedSites: [currentActiveTab, ...storage.trackedSites],
		});
	}
});

chrome.storage.onChanged.addListener(async () => {
	const getStorage = await chrome.storage.local
		.get(["trackedSites"])
		.then((result) => {
			console.log(result.trackedSites);
		});
});
