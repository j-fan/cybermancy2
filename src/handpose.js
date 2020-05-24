import * as handpose from "@tensorflow-models/handpose";
import * as Comlink from "comlink";

let isDetectionUsingWebWorker = true;
const HandDetectorWorker = Comlink.wrap(new Worker("./handpose-worker.js"));
let handDetector;

const videoElement = document.getElementById("webcam-video");
const canvasElement = document.getElementById("webcam-canvas");

let hands = [];
let isHandPresent = false;
const handChangedThreshold = 200;
let handAbsentCount = 0;
let handChanged = true;
let newHandAppeared = false;

const startHandDetectorNormal = async () => {
  handDetector = await handpose.load();
  console.log("handpose loaded");
};

const startHandDetectorWorker = async () => {
  handDetector = await new HandDetectorWorker();
  console.log("handpose loaded");
};

const detectHandWithWorker = async () => {
  const context = canvasElement.getContext("2d");
  context.drawImage(
    videoElement,
    0,
    0,
    videoElement.videoWidth,
    videoElement.videoHeight
  );
  let data = context.getImageData(
    0,
    0,
    videoElement.videoWidth,
    videoElement.videoHeight
  );

  const handEstimate = await handDetector.estimateHandPose(data);
  if (handEstimate) {
    hands = handEstimate;
  }
};

const detectHandNormal = async () => {
  const handEstimate = await handDetector.estimateHands(videoElement);
  hands = handEstimate;
};

const processHandStatus = () => {
  if (hands) {
    if (hands.length == 0) {
      isHandPresent = false;
    } else {
      isHandPresent = true;
    }
    newHandAppeared = false;
    if (!isHandPresent) {
      handAbsentCount++;
      if (handAbsentCount > handChangedThreshold) {
        handChanged = true;
      }
    }
    if (isHandPresent && handChanged) {
      handChanged = false;
      handAbsentCount = 0;
      newHandAppeared = true;
    }
  }
};

const initHandposeDetection = async () => {
  if (isDetectionUsingWebWorker) {
    await startHandDetectorWorker();
  } else {
    await startHandDetectorNormal();
  }
  const estimateHandPose = async () => {
    if (isDetectionUsingWebWorker) {
      await detectHandWithWorker();
    } else {
      await detectHandNormal();
    }
    processHandStatus();
  };

  const runDetection = async () => {
    await estimateHandPose();
    requestAnimationFrame(runDetection);
  };
  runDetection();
};

export { initHandposeDetection, hands, isHandPresent, newHandAppeared };
