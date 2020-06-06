const initCamera = async () => {
  const canvasElement = document.getElementById("webcam-canvas");
  const videoElement = document.getElementById("webcam-video");
  let height = 0;
  let width = 640;
  let aspectRatio;

  const setVideoDimensions = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    if (!aspectRatio) {
      aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    }
    // always fill the shortest side of the window
    if (width < height) {
      console.log("width shorter");
      videoElement.setAttribute("width", width);
      const newHeight = width / aspectRatio;
      videoElement.setAttribute("height", newHeight);
    } else if (width > height) {
      console.log("height shorter");
      videoElement.setAttribute("height", height);
      const newWidth = height * aspectRatio;
      videoElement.setAttribute("width", newWidth);
    }
    canvasElement.setAttribute("width", videoElement.getAttribute("width"));
    canvasElement.setAttribute("height", videoElement.getAttribute("height"));
  };
  videoElement.oncanplay = setVideoDimensions;
  window.addEventListener("resize", () => {
    setVideoDimensions();
  });

  const getWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    if (stream) {
      videoElement.srcObject = stream;
    } else {
      alert("Could not load webcam");
    }
  };
  await getWebcam();
};

export default initCamera;
