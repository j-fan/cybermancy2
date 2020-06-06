import * as faceApi from "face-api.js";

function setIntervalCount(callback, delay, stopCondition) {
  let count = 0;
  const intervalID = window.setInterval(function () {
    count++;
    callback();
    if (stopCondition(count) == true) {
      window.clearInterval(intervalID);
    }
  }, delay);
}

let estimatedGender = "none";
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
  let totalGender = 0;
  let totalAge = 0;
  let successfulDetections = 0;

  const runDetection = async () => {
    const result = await faceApi
      .detectSingleFace(videoElement, detector)
      .withAgeAndGender();
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
    console.log(result, estimatedAge, estimatedGender);
  };

  setIntervalCount(runDetection, 1, (count) => successfulDetections > 50);
};

export { initFaceDetect, runFaceDetect, estimatedAge, estimatedGender };
