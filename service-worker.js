import {
	getCurrentActiveTab,
	loadCurrentActiveTrackedTab,
	setCurrentTabTotalTime,
} from "./utils/service-worker.utils.js";

chrome.runtime.onInstalled.addListener(({ reason }) => {
	reason === "install" && chrome.storage.local.set({ trackedSites: [] });
});

// REFACTOR THIS

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

chrome.webNavigation.onDOMContentLoaded.addListener(
	async ({ url, frameId }) => {
		const [{ id }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		if (frameId === 0) {
			console.log("ready to inject script");
			try {
				await chrome.scripting.executeScript({
					target: { tabId: id },
					files: ["/content-script/connection.js"],
				});
				console.log("successfully injected");
			} catch (err) {
				console.log("unable to inject script");
			}
		}
	}
);

chrome.storage.onChanged.addListener(async () => {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	for (let site of trackedSites) {
		console.table({ time: site.time });
	}
});

chrome.webNavigation.onDOMContentLoaded.addListener(
	async ({ url, frameId }) => {
		// to only wait for the main frame and not subrframes of first load
		if (frameId === 0) {
			console.log("first visit");
			const { trackedSites } = await chrome.storage.local.get([
				"trackedSites",
			]);
			if (trackedSites.length !== 0) {
				const currentActiveTab = await getCurrentActiveTab(url);
				currentActiveTab !== undefined
					? await loadCurrentActiveTrackedTab(currentActiveTab)
					: null;
			}
		}
	}
);

chrome.runtime.onConnect.addListener(async (port) => {
	if (port.name === "connect") {
		let trackedTabUrl;
		let documentId;
		port.onMessage.addListener(async (msg, { sender }) => {
			console.log(msg);
			trackedTabUrl = sender.url;
			// shouldn't this get the latest document id? of a message sender?
			documentId = sender.documentId;
		});
		port.onDisconnect.addListener(async ({ sender }) => {
			if (sender.documentId === documentId) {
				let queryUrl = new URL(sender.url).host;
				console.log(queryUrl);
				const tabs = await chrome.tabs.query({
					url: `https://*.${queryUrl}/*`,
				});
				console.log(tabs);
				const currentActiveTab = await getCurrentActiveTab(trackedTabUrl);
				if (tabs.length === 0 && currentActiveTab !== undefined) {
					console.log("disconnected");
					await setCurrentTabTotalTime(currentActiveTab);
				}
			}
		});
	}
});
