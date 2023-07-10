import { displayCurrentTab } from "./display-tab-data.js";

const slideBtn = document.getElementById("slide-btn");

document.addEventListener("DOMContentLoaded", displayCurrentTab);

slideBtn.addEventListener("click", async (e) => {
  console.log("click");
  animateSlideButton(e);
  await chrome.runtime.sendMessage({ track: true });
});

function animateSlideButton(e) {
  e.preventDefault();
  let target = e.target;
  if (target.classList.contains("isNotTracked")) {
    return target.classList.replace("isNotTracked", "isTracked");
  }
  target.classList.replace("isTracked", "isNotTracked");
}
