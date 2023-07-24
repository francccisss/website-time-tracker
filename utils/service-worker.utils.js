export async function getCurrentActiveTab(url) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	if (trackedSites.length !== 0) {
		return undefined;
	}
	const currentActiveTab = trackedSites.find((site) =>
		site.url.includes(new URL(url).hostname)
	);
	return currentActiveTab;
}

// problem with facebook reels and shit
export async function setCurrentTabTotalTime(currentActiveTab) {
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const calculateTotalTime = (timeSpent, currentTrackedTime) => {
		const currentTime = Date.now();
		const total = timeSpent + (currentTime - currentTrackedTime);
		return total;
	};
	await chrome.storage.local.set({
		trackedSites: trackedSites.map((site) => {
			if (site.url === currentActiveTab.url) {
				const updatedActiveTab = {
					...currentActiveTab,
					time: {
						...site.time,
						totalTimeSpent: calculateTotalTime(
							site.time.totalTimeSpent,
							site.time.currentTrackedTime
						),
						dailyTimeSpent: calculateTotalTime(
							site.time.dailyTimeSpent,
							site.time.currentTrackedTime
						),
					},
				};
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

export async function setCurrentTabToTracked(currentActiveTab) {
	const [{ url, title, favIconUrl }] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const currentTime = Date.now();
	if (currentActiveTab !== undefined) {
		const updateCurrentTab = {
			...currentActiveTab,
			isTracked: currentActiveTab.isTracked ? false : true,
			timesVisited: currentActiveTab.timesVisited + 1,
			time: {
				...currentActiveTab.time,
				currentTrackedTime: currentTime,
			},
		};
		await chrome.storage.local.set({
			trackedSites: trackedSites.map((site) => {
				site.url.includes(currentActiveTab.url) ? updateCurrentTab : site;
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
