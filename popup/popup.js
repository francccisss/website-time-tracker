const clickMe = document.getElementById("click-me");
console.log(clickMe);

function onClick() {
	console.log("onClick");
	// chrome.runtime.sendMessage({ greetings: "hello from script.js" });
}
clickMe.addEventListener("click", async () => {
	console.log("onClick");
	const { response } = await chrome.runtime.sendMessage({ greeting: "hello" });
	console.log("response");
});
