const initCamera = async () => {
  const canvasElement = document.getElementById("webcam-canvas");
  const videoElement = document.getElementById("webcam-video");
  let height = 0;
  let width = 640;
  let streaming = false;

  const setVideoDimensions = () => {
    if (!streaming) {
      width = window.innerWidth;
      height = videoElement.videoHeight / (videoElement.videoWidth / width);

      videoElement.setAttribute("width", width);
      videoElement.setAttribute("height", height);
      canvasElement.setAttribute("width", width);
      canvasElement.setAttribute("height", height);
      streaming = true;
    }
  };
  videoElement.oncanplay = setVideoDimensions;

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
