import * as Comlink from "comlink";

const HandDetector = Comlink.wrap(new Worker("./handpose-worker.js"));
let handDetector;
const videoElement = document.getElementById("webcam-video");
const canvasElement = document.getElementById("webcam-canvas");

const initHandposeDetection = async (hands) => {
  handDetector = await new HandDetector();
  console.log("handpose loaded");

  const estimateHandPose = async () => {
    const context = canvasElement.getContext("2d");
    context.drawImage(
      videoElement,
      0,
      0,
      videoElement.width,
      videoElement.height
    );
    var data = context.getImageData(
      0,
      0,
      videoElement.width,
      videoElement.height
    );

    const estimation = await handDetector.estimateHandPose(data);
    if (estimation) {
      hands.data = estimation;
    }
    console.log("detecting hands", estimation, hands.data);
  };

  const runDetection = async () => {
    await estimateHandPose();
    requestAnimationFrame(runDetection);
  };
  runDetection();
};

export default initHandposeDetection;
