import initCamera from "./webcam";
import initHandposeDetection from "./handpose";
import initThreeCanvas from "./mainCanvas";
import initFaceDetect from "./faceDetect";

const initAll = async () => {
  let hands = { data: [] };
  await initCamera();
  await initFaceDetect();
  await initHandposeDetection(hands);
  initThreeCanvas(hands);
};

initAll();
