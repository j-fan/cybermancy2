import * as faceApi from "face-api.js";

const initFaceDetect = async () => {
  const videoElement = document.getElementById("webcam-video");

  await faceApi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceApi.nets.ageGenderNet.loadFromUri("/models");

  // tiny_face_detector options
  let inputSize = 512;
  let scoreThreshold = 0.5;
  const detector = await new faceApi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });

  console.log("load age gender");

  const runDetection = async () => {
    const result = await faceApi
      .detectSingleFace(videoElement, detector)
      .withAgeAndGender();

    console.log(result);
    requestAnimationFrame(runDetection);
  };
  runDetection();
};

export default initFaceDetect;
