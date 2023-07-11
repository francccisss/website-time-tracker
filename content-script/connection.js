(async function () {
  console.log("called");
  chrome.runtime.connect({ name: "connect" });
})();
