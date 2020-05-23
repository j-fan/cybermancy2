import initCamera from "./webcam";
import initHandposeDetection from "./handpose";
import initThreeCanvas from "./mainCanvas";
import { initFaceDetect, runFaceDetect } from "./faceDetect";
import "./app.scss";

const initAll = async () => {
  let hands = { data: [] };
  await initCamera();
  await initFaceDetect();
  await runFaceDetect();
  await initHandposeDetection(hands);
  initThreeCanvas(hands);
};

// initAll();
