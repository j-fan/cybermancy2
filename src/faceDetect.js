import * as faceApi from "face-api.js";
import * as Comlink from "comlink";


// haven't figured a way for webworkers to work with faceAPI
// do to issues discussed here: https://github.com/justadudewhohacks/face-api.js/issues/47
let isDetectionUsingWebWorker = false;
let estimatedGender = "none";
let estimatedAge = 0;
let detector;
const FaceDetectorWorker = Comlink.wrap(new Worker("./faceDetect-worker.js"));

const videoElement = document.getElementById("webcam-video");
const canvasElement = document.getElementById("webcam-canvas");

const startFaceDetectNormal = async () => {
  await faceApi.nets.tinyFaceDetector.loadFromUri("./models");
  await faceApi.nets.ageGenderNet.loadFromUri("./models");

  // tiny_face_detector options
  let inputSize = 512;
  let scoreThreshold = 0.5;
  detector = await new faceApi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });

  console.log("tinyface loaded");
};

const runDetectionNormal = async () => {
  const result = await faceApi
    .detectSingleFace("webcam-video", detector)
    .withAgeAndGender();
  return result;
};

const startFaceDetectWorker = async () => {
  detector = await new FaceDetectorWorker();
};

const runDetectionWorker = async () => {
  const context = canvasElement.getContext("2d");
  var data = context.getImageData(
    0,
    0,
    videoElement.videoWidth,
    videoElement.videoHeight
  );
  const result = await detector.estimateFace(data);
  return result;
};

let totalGender = 0;
let totalAge = 0;
let successfulDetections = 0;

const initFaceDetect = async () => {
  if (isDetectionUsingWebWorker) {
    await startFaceDetectWorker();
  } else {
    await startFaceDetectNormal();
  }
  await runFaceDetection();
};

const runDetectionOnce = async () => {
  let result;
  if (isDetectionUsingWebWorker) {
    result = await runDetectionWorker();
  } else {
    result = await runDetectionNormal();
  }
  if (result) {
    successfulDetections++;
    if (result.gender === "female") {
      totalGender += result.genderProbability;
    } else {
      totalGender -= result.genderProbability;
    }
    totalAge += result.age;
    estimatedAge = totalAge / successfulDetections;
    estimatedGender =
      totalGender == 0 ? "none" : totalGender > 0 ? "female" : "male";
  }
};
const runFaceDetection = async () => {
  const numDetectionsToAverage = 5;
  for (let i = 0; i < numDetectionsToAverage; i++) {
    await runDetectionOnce();
  }
};

const resetFaceDetection = () => {
  console.log("reset face detect");
  totalGender = 0;
  totalAge = 0;
  successfulDetections = 0;
};

export {
  initFaceDetect,
  estimatedAge,
  estimatedGender,
  resetFaceDetection,
  runFaceDetection,
};
