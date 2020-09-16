const loadingScreen = document.getElementById("loadingScreen");
const loadingButton = document.getElementById("loadingButton");

const hideLoadingScreen = () => {
  // loadingButton.addEventListener("click", () => {
  //   loadingScreen.classList.add("hidden");
  // })
  // loadingButton.classList.remove("hidden");
  // loadingButton.innerHTML = "Enter artwork";
  loadingScreen.classList.add("hidden");
};

export { hideLoadingScreen };
