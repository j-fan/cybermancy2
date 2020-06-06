import { estimatedAge, estimatedGender } from "./faceDetect";
import { hands, newHandAppeared } from "./handpose";
import * as elementContent from "./elements.json";

let ageGenderContent = [];
let handElement = "";

const distance = (x1, y1, z1, x2, y2, z2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const z = z1 - z2;
  return Math.sqrt(x * x + y * y + z * z);
};

const distanceWithArray = (p1, p2) =>
  distance(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);

const getHandElement = () => {
  if (newHandAppeared) {
    const annotations = hands[0].annotations;
    const palmWidth = distanceWithArray(
      annotations.palmBase[0],
      annotations.middleFinger[0]
    );
    const fingerLength = distanceWithArray(
      annotations.middleFinger[0],
      annotations.middleFinger[3]
    );
    const palmLength = distanceWithArray(
      annotations.indexFinger[0],
      annotations.pinky[0]
    );

    const palmRatio = palmLength / palmWidth;
    const fingerToPalmRatio = fingerLength / palmLength;

    const isLongFingers = fingerToPalmRatio > 1.1;
    const isWideHand = palmRatio > 1;

    if (!isWideHand && isLongFingers) {
      handElement = "water";
    } else if (!isWideHand && !isLongFingers) {
      handElement = "fire";
    } else if (isWideHand && isLongFingers) {
      handElement == "air";
    } else {
      handElement == "earth";
    }
    console.log(handElement);
  }

  return handElement ? elementContent[handElement] : "";
};

const getAgeGenderContent = () => {
  if (newHandAppeared) {
    const key = `${Math.floor(estimatedAge / 10) * 10}-${
      (Math.floor(estimatedAge / 10) + 1) * 10
    }`;
    console.log("getGenderAge", key, newHandAppeared);
  }
  return ageGenderContent;
};

export { getHandElement, getAgeGenderContent };
