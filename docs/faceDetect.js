import * as faceApi from "face-api.js";

function setIntervalCount(callback, delay, repetitions) {
  let count = 0;
  const intervalID = window.setInterval(function () {
    count++;
    callback(count);
    if (count === repetitions) {
      window.clearInterval(intervalID);
    }
  }, delay);
}

let estimatedGender = null;
let estimatedAge = 0;
let detector;

const initFaceDetect = async () => {
  await faceApi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceApi.nets.ageGenderNet.loadFromUri("/models");

  // tiny_face_detector options
  let inputSize = 512;
  let scoreThreshold = 0.5;
  detector = await new faceApi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });

  console.log("tinyface loaded");
};

const runFaceDetect = () => {
  const videoElement = document.getElementById("webcam-video");
  let femaleFaceCount = 0;
  let totalAge = 0;
  const timesToRunDetection = 20;
  const runDetection = async (count) => {
    const result = await faceApi
      .detectSingleFace(videoElement, detector)
      .withAgeAndGender();
    if (result) {
      if (result.gender === "female") {
        femaleFaceCount++;
      }
      totalAge += result.age;
    }

    estimatedAge = totalAge / count;
    estimatedGender = femaleFaceCount > count / 2 ? "female" : "male";
    console.log(result);
  };
  setIntervalCount(runDetection, 1, timesToRunDetection);
};

export { initFaceDetect, runFaceDetect, estimatedAge, estimatedGender };
