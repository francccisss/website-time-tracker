import { getCurrentActiveTab } from "./utils/service-worker.utils.js";

chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

chrome.runtime.onMessage.addListener(async ({ track }) => {
	if (track) {
		const [{ url, title, favIconUrl }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		const currentActiveTab = await getCurrentActiveTab(url);
		const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
		const currentTime = Date.now();
		if (currentActiveTab !== undefined) {
			await chrome.storage.local.set({
				trackedSites: trackedSites.map((site) => {
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
				}),
			});
		} else {
			const createCurrentTabData = {
				url: new URL(url).hostname,
				title,
				favIconUrl,
				isTracked: true,
				timesVisited: 1,
				time: {
					currentTrackedTime: currentTime,
					totalTimeSpent: 0,
					dailyTimeSpent: 0,
				},
			};
			await chrome.storage.local.set({
				trackedSites: [createCurrentTabData, ...trackedSites],
			});
		}
	}
});

chrome.history.onVisited.addListener(async () => {
	const [{ id }] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	try {
		await chrome.scripting.executeScript({
			target: { tabId: id },
			files: ["/content-script/connection.js"],
		});
		console.log("successfully injected");
	} catch (err) {
		console.log("unable to inject script");
	}
});

chrome.storage.onChanged.addListener(async () => {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	console.log(trackedSites);
});

chrome.history.onVisited.addListener(async ({ url }) => {
	// whenever a user navigates on a website, this listener is called
	// even though it's navigating within the same origin
	// so when a user navigates the extension keeps updating the time
	// instead of retaining the same time from the initial visit
	// need to either disconnect the script when navigating within a website
	console.log("lol");
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	if (trackedSites.length !== 0) {
		const currentActiveTab = await getCurrentActiveTab(url);
		if (currentActiveTab !== undefined) {
			const currentTime = Date.now();
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
	} else {
		console.log("tracked sites empty");
	}
});

chrome.runtime.onConnect.addListener(async (port) => {
	if (port.name === "connect") {
		let trackedTabUrl;
		let documentId;
		port.onMessage.addListener(async (msg, { sender }) => {
			console.log(msg);
			trackedTabUrl = sender.url;
			documentId = sender.documentId;
		});
		port.onDisconnect.addListener(async ({ sender }) => {
			console.log("disconnected");
			// refreshing disconnects the connection
			const currentActiveTab = await getCurrentActiveTab(trackedTabUrl);
			if (
				sender.documentId === documentId &&
				currentActiveTab !== undefined
			) {
				const currentTime = Date.now();
				const { trackedSites } = await chrome.storage.local.get([
					"trackedSites",
				]);
				await chrome.storage.local.set({
					trackedSites: trackedSites.map((site) => {
						if (site.url === currentActiveTab.url) {
							const updatedActiveTab = {
								...currentActiveTab,
								time: {
									...currentActiveTab.time,
									totalTimeSpent:
										currentActiveTab.time.totalTimeSpent +
										(currentTime -
											currentActiveTab.time.currentTrackedTime),
									dailyTimeSpent: 20,
								},
							};
							console.log(updatedActiveTab);
							return updatedActiveTab;
						}
						return site;
					}),
				});
			} else {
				console.log("is not in database");
			}
		});
	}
});

chrome.webNavigation.onDomContentLoaded.addListener((details) => {
	console.log(details.url);
});
