const loadingScreen = document.getElementById("loadingScreen");
const loadingButton = document.getElementById("loadingButton");

const hideLoadingScreen = () => {
  loadingScreen.classList.add("hidden");

  setInterval(function () {
    location.reload();
  }, 900000);
};

export { hideLoadingScreen };
