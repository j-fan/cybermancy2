import {
  hands,
  isHandPresent,
  NUM_HAND_LANDMARKS,
  newHandAppeared,
} from "./handPose";
import { getAgeGenderContent, getHandElement } from "./analyseUser";
import {
  initThreeFont,
  createTextObj,
  FontNames,
  createTextObjOnly,
  alignText,
} from "./threeTextUtil";
import * as THREE from "three";
import { loadImageSvg, loadImage } from "./threeImageUtil";
import { hideLoadingScreen } from "./loadingScreen";
import { Vector3 } from "three";
import { shuffle } from "@tensorflow/tfjs-core/dist/util";
import { resetFaceDetection, runFaceDetection } from "./faceDetect";

const textColors = [0xff66ff, 0x00ffff, 0xac66ff, 0x00b8ff, 0x5468ff];
let shuffledHandOrder = [];
let handLandmarks = [];
let ageGenderContent3d = [];
let scene;
let canvasWidth,
  canvasHeight = 0;
let isLoaded = false;
let waitingHandText, waitingHandObj;
let anyHandSeenYet = false;

const initThreeHands = async (sceneRef, width, height) => {
  scene = sceneRef;
  canvasHeight = height;
  canvasWidth = width;
  loadLandmarks(NUM_HAND_LANDMARKS);
  await initThreeFont();
  waitingHandText = createTextObj(
    scene,
    "Looking for hand...",
    new THREE.Vector3(canvasWidth / 2, canvasHeight / -2 + 0.6, -1),
    FontNames.Helvetiker,
    canvasHeight * 3,
    0x00ffff,
    "centre",
    0.6
  );
  waitingHandObj = await loadImageSvg(
    "img/hand.svg",
    new THREE.Vector3(canvasWidth / 2, canvasHeight / -2 + 0.5, -1),
    0x00ffff,
    1.3
  );
  for (let i = 0; i < NUM_HAND_LANDMARKS; i++) {
    shuffledHandOrder.push(i);
  }
  shuffle(shuffledHandOrder);
  scene.add(waitingHandObj);
};

const loadLandmarks = (numPlanes) => {
  const planeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffff00,
    metalness: 0,
    roughness: 0,
    opacity: 0.5,
    blendEquation: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  for (let i = 0; i < numPlanes; i++) {
    const planeMesh = new THREE.Mesh(geometry, planeMaterial);
    planeMesh.scale.x = 0.03;
    planeMesh.scale.y = 0.03;
    planeMesh.scale.z = 0.03;
    planeMesh.position.z = -1;
    planeMesh.position.x = (i - numPlanes / 2) * 0.5;
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);
    handLandmarks.push(planeMesh);
  }
};

const removeAllAgeGenderContent = () => {
  ageGenderContent3d.forEach((obj) => {
    obj.material.dispose();
    obj.geometry.dispose();
    scene.remove(obj);
  });
  ageGenderContent3d = [];
};

const getAgeGender3dContent = async () => {
  removeAllAgeGenderContent();
  const content = getAgeGenderContent();
  let newContent3d = [];
  for await (let item of content) {
    let image = null;
    if (item.logo) {
      if (item.logo.includes("svg")) {
        image = await loadImageSvg(`logos/${item.logo}`);
      } else {
        image = await loadImage(`logos/${item.logo}`);
      }
    }
    if (image) {
      newContent3d.push(image);
    }
    if (item.text) {
      const textObj = createTextObjOnly(
        item.text,
        new THREE.Vector3(0, 0, -2),
        FontNames.Helvetiker,
        canvasHeight * 3,
        textColors[newContent3d.length % textColors.length],
        "centre",
        0.6
      );
      newContent3d.push(textObj);
    }
  }

  const handElement = createTextObjOnly(
    getHandElement(),
    new THREE.Vector3(0, 0, -2),
    FontNames.Helvetiker,
    canvasHeight * 3,
    textColors[newContent3d.length % textColors.length],
    "centre",
    0.6
  );
  newContent3d.push(handElement);

  ageGenderContent3d = newContent3d;
  ageGenderContent3d.forEach((item) => {
    scene.add(item);
  });
};

const updateAgeGenderContent = () => {
  const handCentre = new THREE.Vector3(
    hands[0].annotations.middleFinger[0][0] * 0.01,
    hands[0].annotations.middleFinger[0][1] * -0.01,
    hands[0].annotations.middleFinger[0][2] * 0.01
  );

  ageGenderContent3d.forEach((item, index) => {
    item.position.set(
      handLandmarks[index].position.x,
      handLandmarks[index].position.y,
      handLandmarks[index].position.z
    );

    if (
      item.position.x < handCentre.x + 0.05 &&
      item.position.x > handCentre.x - 0.05
    ) {
      alignText(item.geometry, "centre");
    } else if (item.position.x > handCentre) {
      alignText(item.geometry, "right");
    } else {
      alignText(item.geometry, "left");
    }
    item.lookAt(canvasWidth / 2, canvasHeight / -2, 1);
  });
};

const hideAgeGenderContent = () => {
  ageGenderContent3d.forEach((item) => {
    item.position.set(0, 0, 0);
  });
};

let handLandmarksHistory = {};
let smoothPower = 10;
const updateLandmarksSmooth = () => {
  hands[0].landmarks.forEach((landmark, index) => {
    const newLandmarkPos = new THREE.Vector3(
      landmark[0] * 0.01,
      landmark[1] * -0.01,
      -1
    );

    if (!(index in handLandmarksHistory)) {
      handLandmarksHistory[index] = {
        history: [],
        total: new THREE.Vector3(),
      };
    }
    handLandmarksHistory[index].history.push(newLandmarkPos);
    handLandmarksHistory[index].total.add(newLandmarkPos);

    const historyLength = handLandmarksHistory[index].history.length;
    if (historyLength > smoothPower) {
      const oldestHistoryPos = handLandmarksHistory[index].history.shift();
      handLandmarksHistory[index].total.sub(oldestHistoryPos);
    }

    const averagePosition = new Vector3(
      handLandmarksHistory[index].total.x / (historyLength - 1),
      handLandmarksHistory[index].total.y / (historyLength - 1),
      -1
    );

    const shuffledIndex = shuffledHandOrder[index];
    handLandmarks[shuffledIndex].position.set(
      averagePosition.x,
      averagePosition.y,
      averagePosition.z
    );
  });
};

const hideHandLandmarks = () => {
  handLandmarks.forEach((landmark) => {
    landmark.position.set(0, 0, 0);
  });
};

const updateHandUI = async () => {
  if (!isLoaded) {
    hideLoadingScreen();
    isLoaded = true;
  }

  if (newHandAppeared) {
    resetFaceDetection();
    await runFaceDetection();
    await getAgeGender3dContent();
  }

  if (isHandPresent) {
    anyHandSeenYet = true;
    waitingHandText.updateText("");
    updateAgeGenderContent();
    updateLandmarksSmooth();
    waitingHandObj.position.set(10, 10, 10);
  } else {
    hideAgeGenderContent();
    hideHandLandmarks();
    if (anyHandSeenYet) {
      waitingHandText.updateText("Looking for hand...");
    } else {
      waitingHandText.updateText("Hold your hand up to the camera. Please wait for detection.");
    }
    waitingHandObj.position.set(0, 0, 0);
  }
};

export { initThreeHands, updateHandUI };
