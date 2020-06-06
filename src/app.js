import initCamera from "./webcam";
import { initHandposeDetection } from "./handpose";
import initThreeCanvas from "./mainCanvas";
import { initFaceDetect, runFaceDetect } from "./faceDetect";
import "./app.scss";

const initAll = async () => {
  await initCamera();
  await initFaceDetect();
  await runFaceDetect();
  await initHandposeDetection();
  initThreeCanvas();
};

initAll();
