import initCamera from "./webcam";
import initHandposeDetection from "./handpose";
import initThreeCanvas from "./mainCanvas";

const initAll = async () => {
  let hands = { data: [] };
  await initCamera();
  await initHandposeDetection(hands);
  initThreeCanvas(hands);
};

initAll();
