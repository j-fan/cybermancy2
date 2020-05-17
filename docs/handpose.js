import * as handpose from "@tensorflow-models/handpose";

const initHandposeDetection = async (hands) => {
  let model = await handpose.load();
  console.log("handpose loaded");

  const estimateHandPose = async () => {
    const videoElement = document.getElementById("webcam-video");

    const handEstimate = await model.estimateHands(videoElement, true);
    if (!handEstimate) {
      return;
    }
    hands.data = handEstimate;
  };

  const runDetection = async () => {
    await estimateHandPose();
    requestAnimationFrame(runDetection);
  };
  runDetection();
};

export default initHandposeDetection;
