const initCamera = async () => {
  const canvasElement = document.getElementById("webcam-canvas");
  const videoElement = document.getElementById("webcam-video");
  let height = 0;
  let width = 640;

  const setVideoDimensions = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    videoElement.setAttribute("width", width);
    videoElement.setAttribute("height", height);
    canvasElement.setAttribute("width", width);
    canvasElement.setAttribute("height", height);
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
