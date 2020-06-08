import initCamera from "./webcam";
import { initHandposeDetection } from "./handPose";
import initThreeCanvas from "./mainCanvas";
import { initFaceDetect } from "./faceDetect";
import "./app.scss";

const initAll = async () => {
  await initCamera();
  await initFaceDetect();
  await initHandposeDetection();
  await initThreeCanvas();
};

initAll();
