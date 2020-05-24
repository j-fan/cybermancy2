import * as faceApi from "face-api.js";
import * as Comlink from "comlink";

class FaceDetectorWorker {
  constructor() {
    this.detector = null;
    faceApi.nets.tinyFaceDetector
      .loadFromUri("./models")
      .then(() => {
        faceApi.nets.ageGenderNet.loadFromUri("./models");
      })
      .then(() => {
        let inputSize = 512;
        let scoreThreshold = 0.5;
        let newDetector = new faceApi.TinyFaceDetectorOptions({
          inputSize,
          scoreThreshold,
        });
        return newDetector;
      })
      .then((newDetector) => {
        this.detector = newDetector;
      });
  }
  async estimateFace(imgData) {
    const img = faceApi.createCanvasFromMedia(imgData);
    if (!this.detector) {
      return null;
    }
    const faceEstimate = await faceApi
      .detectSingleFace(img, detector)
      .withAgeAndGender();
    return faceEstimate;
  }
}

Comlink.expose(FaceDetectorWorker);
