import { displayCurrentTab, animateSlideButton } from "./popup-dom-visuals.js";

const slideBtn = document.getElementById("slide-btn");

document.addEventListener("DOMContentLoaded", displayCurrentTab);

slideBtn.addEventListener("click", async (e) => {
  console.log("click");
  animateSlideButton(e);
  await chrome.runtime.sendMessage({ track: true });
});
