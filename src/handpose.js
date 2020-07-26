import * as handpose from "@tensorflow-models/handpose";
import * as Comlink from "comlink";

// use webworker on chrome only; other browsers have bad performance with it
let isDetectionUsingWebWorker =
  !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
const HandDetectorWorker = Comlink.wrap(new Worker("./handpose-worker.js"));
let handDetector;

const videoElement = document.getElementById("webcam-video");
const canvasElement = document.getElementById("webcam-canvas");

let hands = [];
let isHandPresent = false;
const handChangedThreshold = 10;
let handAbsentCount = 0;
let handChanged = true;
let newHandAppeared = false;
const NUM_HAND_LANDMARKS = 21;

const startHandDetectorNormal = async () => {
  handDetector = await handpose.load();
  console.log("handpose loaded");
};

const startHandDetectorWorker = async () => {
  handDetector = await new HandDetectorWorker();
  console.log("handpose loaded");
};

const detectHandWithWorker = async () => {
  if (videoElement.videoHeight == 0 || videoElement.videoWidth == 0) {
    return;
  }
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
      console.log("new hand appeared");
    }
  }
};

const initHandposeDetection = async () => {
  if (isDetectionUsingWebWorker) {
    console.log("using web workers");
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

export {
  initHandposeDetection,
  hands,
  isHandPresent,
  newHandAppeared,
  NUM_HAND_LANDMARKS,
};
