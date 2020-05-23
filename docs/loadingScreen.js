const loadingScreen = document.getElementById("loadingScreen");

const removeLoadingScreen = () => {
  loadingScreen.classList.remove("active");
};

export { removeLoadingScreen };
