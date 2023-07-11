(async function () {
  console.log("called");
  console.log("port");
  const port = chrome.runtime.connect({ name: "connect" });
  port.postMessage("connected");
})();
