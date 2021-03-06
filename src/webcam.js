const initCamera = async () => {
  const canvasElement = document.getElementById("webcam-canvas");
  const videoElement = document.getElementById("webcam-video");
  let height = 0;
  let width = 640;
  let aspectRatio;

  const setVideoDimensions = () => {
    width = screen.width;
    height = screen.height;
    if (!aspectRatio) {
      aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    }
    // always fill the shortest side of the window
    if (width < height) {
      videoElement.setAttribute("width", width);
      const newHeight = width / aspectRatio;
      videoElement.setAttribute("height", newHeight);
    } else if (width >= height) {
      videoElement.setAttribute("height", height);
      const newWidth = height * aspectRatio;
      videoElement.setAttribute("width", newWidth);
    }
    canvasElement.setAttribute("width", videoElement.videoWidth);
    canvasElement.setAttribute("height", videoElement.videoHeight);
  };
  videoElement.oncanplay = setVideoDimensions;
  window.addEventListener("resize", () => {
    setVideoDimensions();
  });

  const getWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoElement.srcObject = stream;
    } catch (err) {
      alert(`Could not start webcam. ${err}`);
    }
  };
  await getWebcam();
};

export default initCamera;
