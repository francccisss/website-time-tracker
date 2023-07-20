export async function displayCurrentTab() {
	const [{ url }] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	const slideBtn = document.getElementById("slide-btn");
	const { trackedSites } = await chrome.storage.local.get(["trackedSites"]);
	const header = document.getElementById("website-title");
	const metrics = document.querySelectorAll(".metric-data");
	const formatMetricData = ({
		time: { totalTimeSpent, dailyTimeSpent, currentTrackedTime },
		visits,
	}) => {
		const calculateTotalTime = (totalTime, currentTrackedTime) => {
			const calculate = totalTime + (Date.now() - currentTrackedTime);
			const millToHours = (calculate / (1000 * 60 * 60)) % 24;
			return Math.floor(millToHours);
		};
		if (visits !== undefined) {
			return {
				data: [
					calculateTotalTime(totalTimeSpent, currentTrackedTime),
					visits,
					calculateTotalTime(dailyTimeSpent, currentTrackedTime),
				],
			};
		}
	};
	const currentActiveTab = trackedSites.find(
		(site) => site.url === new URL(url).hostname
	);
	let headerText = new URL(url).host.split(".")[1];
	let formatHeaderText = headerText.replace(
		headerText[0],
		headerText.charAt(0).toUpperCase()
	);
	header.textContent = new URL(url).hostname;

	if (currentActiveTab !== undefined) {
		const { data } = formatMetricData({
			time: currentActiveTab.time,
			visits: currentActiveTab.timesVisited,
		});
		metrics.forEach((metric, i) => {
			const createHrsText = document.createElement("span");
			console.log(createHrsText);
			createHrsText.classList.add("hrs-text");
			createHrsText.textContent = "hrs";
			metric.append(createHrsText);
			metric.textContent = data[i];
			i % 2 === 0 &&
				metric.insertAdjacentElement("beforeend", createHrsText);
		});
		currentActiveTab.isTracked &&
			slideBtn.classList.replace("isNotTracked", "isTracked");
	}
}

export function animateSlideButton(e) {
	e.preventDefault();
	let target = e.target;
	if (target.classList.contains("isNotTracked")) {
		return target.classList.replace("isNotTracked", "isTracked");
	}
	target.classList.replace("isTracked", "isNotTracked");
}
