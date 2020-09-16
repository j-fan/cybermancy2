const loadingScreen = document.getElementById("loadingScreen");
const loadingButton = document.getElementById("loadingButton");

const hideLoadingScreen = () => {
  loadingScreen.classList.add("hidden");

  setInterval(function () {
    location.reload();
  }, 1800000);
};

export { hideLoadingScreen };
