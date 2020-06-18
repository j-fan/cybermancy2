import * as handpose from "@tensorflow-models/handpose";
import * as Comlink from "comlink";

class HandDetectorWorker {
  constructor() {
    this.model = null;
    handpose.load().then((loadedModel) => {
      this.model = loadedModel;
    });
  }
  async estimateHandPose(input) {
    if (!this.model) {
      return null;
    }
    const handEstimate = await this.model.estimateHands(input, true);
    return handEstimate;
  }
}

Comlink.expose(HandDetectorWorker);
