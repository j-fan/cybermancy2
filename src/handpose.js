import * as handpose from "@tensorflow-models/handpose";

let hands = [];
let isHandPresent = false;

const handChangedThreshold = 200;
let handAbsentCount = 0;
let handChanged = true;
let newHandAppeared = false;

const initHandposeDetection = async () => {
  let model = await handpose.load();
  console.log("handpose loaded");

  const estimateHandPose = async () => {
    const videoElement = document.getElementById("webcam-video");
    const handEstimate = await model.estimateHands(videoElement);
    if (!handEstimate) {
      return;
    }
    hands = handEstimate;

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
    }
  };

  const runDetection = async () => {
    await estimateHandPose();
    requestAnimationFrame(runDetection);
  };
  runDetection();
};

export { initHandposeDetection, hands, isHandPresent, newHandAppeared };
