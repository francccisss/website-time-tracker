chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(
	async ({ track }, sender, sendResponse) => {
		// on click event of popup track button
		// send message to service worker to track the current site,
		// and check if the current site exists on our trackedSites[]
		// and if so set its property isTracked to true,
		// update its time property currentTrackedTime to new Date()
		// and update the timesVisited + 1

		// but if the track button is clicked and the current site,
		// does not exist in our local storage then
		// create the data for the new tracked site and store it to our
		// local storage, while setting the isTracked to true .
		const storage = await chrome.storage.local.get(["trackedSites"]);
		const [{ url, title }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});

		// returns the current active tab that exists on our DB
		// checking the current tab already
		const currentActiveTab = storage.trackedSites.find(
			(site) => site.url === new URL(url).origin
		);
		console.log(currentActiveTab);

		if (track && storage.trackedSites.length > 0) {
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
		} else if (track && storage.trackedSites.length === 0) {
			const createCurrentTabData = {
				url: new URL(url).origin,
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
