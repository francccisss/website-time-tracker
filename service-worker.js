chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.track) {
		const [{ url, title }] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		console.log({ url, title });
	}
});
