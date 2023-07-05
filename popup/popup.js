const clickMe = document.getElementById("click-me");

clickMe.addEventListener("click", async () => {
	console.log("onClick");
	const { response } = await chrome.runtime.sendMessage({ track: true });
});
