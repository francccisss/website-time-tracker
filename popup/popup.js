const slideBtn = document.getElementById("slide-btn");

function animateSlideButton(e) {
  e.preventDefault();
  let target = e.target;
  // const btnAnimationDuration = target.style.before;
  // console.log(btnAnimationDuration);
  let animationDuration =
    window.getComputedStyle(target).animationDuration.slice(0, -1) * 1000;
  console.log(animationDuration);
  // if (target.classList.contains("isNotTracked")) {
  //   return setTimeout(() => {
  //     target.classList.replace("isNotTracked", "isTracked");
  //   }, animationDuration);
  // }
  // setTimeout(() => {
  //   target.classList.replace("isTracked", "isNotTracked");
  // }, animationDuration);
  if (target.classList.contains("isNotTracked")) {
    return target.classList.replace("isNotTracked", "isTracked");
  }
  target.classList.replace("isTracked", "isNotTracked");
}
slideBtn.addEventListener("click", async (e) => {
  console.log("onClick");
  animateSlideButton(e);
  // const { response } = await chrome.runtime.sendMessage({ track: true });
});
