import { estimatedAge, estimatedGender } from "./faceDetect";
import { hands } from "./handPose";
import * as elementContent from "./elements.json";
import * as allAgeGenderContent from "./ageContent.json";
import { shuffle } from "./shuffle";

const distance = (x1, y1, z1, x2, y2, z2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const z = z1 - z2;
  return Math.sqrt(x * x + y * y + z * z);
};

const distanceWithArray = (p1, p2) =>
  distance(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);

const getHandElement = () => {
  let handElement = "";
  if (hands.length > 0) {
    const annotations = hands[0].annotations;
    const palmHeight = distanceWithArray(
      annotations.palmBase[0],
      annotations.middleFinger[0]
    );
    const fingerLength = distanceWithArray(
      annotations.middleFinger[0],
      annotations.middleFinger[3]
    );
    const palmWidth = distanceWithArray(
      annotations.indexFinger[0],
      annotations.pinky[0]
    );

    const palmRatio = palmWidth / palmHeight;
    const fingerToPalmRatio = fingerLength / palmHeight;

    const isLongFingers = fingerToPalmRatio > 1.4;
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
  }

  return handElement ? elementContent[handElement] : "";
};

const getNRandomElements = (array, n) => {
  let randomElements = array.slice();
  if (n > array.length - 1) {
    n = array.length - 1;
  }
  randomElements = shuffle(randomElements);
  return randomElements.slice(0, n);
};

const getAgeGenderContent = () => {
  let key = "0-0";
  if (estimatedAge > 0) {
    key = `${Math.floor(estimatedAge / 10) * 10}-${
      (Math.floor(estimatedAge / 10) + 1) * 10
    }`;
  }
  if (key in allAgeGenderContent) {
    const allAgeContent = allAgeGenderContent[key];
    let content = getNRandomElements(allAgeContent["none"], 5);
    if (estimatedGender != "none") {
      const contentGender = getNRandomElements(
        allAgeContent[estimatedGender],
        2
      );
      content = [...content, ...contentGender];
    }
    return content;
  }
};

export { getHandElement, getAgeGenderContent };
