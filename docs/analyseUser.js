import { estimatedAge, estimatedGender } from "./faceDetect";
import { hands, isHandPresent, newHandAppeared } from "./handpose";

const getHandElement = () => {};

const getAgeGenderContent = () => {
  if (newHandAppeared) {
    console.log("getGenderAge", estimatedGender, estimatedAge, newHandAppeared);
    console.log("-----");
  }
};

export { getHandElement, getAgeGenderContent };
