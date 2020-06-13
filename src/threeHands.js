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

const textColors = [0xff66ff, 0x00ffff, 0xac66ff, 0x00b8ff, 0x5468ff];
let handLandmarks = [];
let ageGenderContent3d = [];
let scene;
let canvasWidth,
  canvasHeight = 0;
let isLoaded = false;
let waitingHandObj;

const initThreeHands = async (sceneRef, width, height) => {
  scene = sceneRef;
  canvasHeight = height;
  canvasWidth = width;
  loadLandmarks(NUM_HAND_LANDMARKS);
  await initThreeFont();
  waitingHandObj = createTextObj(
    scene,
    "Looking for hands...\n(First time may take some time)",
    new THREE.Vector3(canvasWidth / 2, canvasHeight / -2, -2),
    FontNames.Helvetiker,
    20,
    0x00ffff,
    "centre",
    0.6
  );
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
        10,
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
    10,
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
  const handCentre = hands[0].annotations.middleFinger[0][0] * 0.01;

  ageGenderContent3d.forEach((item, index) => {
    item.position.set(
      handLandmarks[index].position.x,
      handLandmarks[index].position.y,
      handLandmarks[index].position.z
    );

    if (
      item.position.x < handCentre + 0.0001 &&
      item.position.x > handCentre - 0.0001
    ) {
      alignText(item.geometry, "centre");
    } else if (item.position.x > handCentre) {
      alignText(item.geometry, "right");
    } else {
      alignText(item.geometry, "left");
    }
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

    handLandmarks[index].position.set(
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
    await getAgeGender3dContent();
  }

  if (isHandPresent) {
    waitingHandObj.updateText("");
    updateAgeGenderContent();
    updateLandmarksSmooth();
  } else {
    waitingHandObj.updateText("Looking for hands...");
    hideAgeGenderContent();
    hideHandLandmarks();
  }
};

export { initThreeHands, updateHandUI };
