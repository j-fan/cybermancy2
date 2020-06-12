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
} from "./threeTextUtil";
import * as THREE from "three";
import { loadImageSvg, loadImage } from "./threeImageUtil";
import { hideLoadingScreen } from "./loadingScreen";

const textColors = [0xff00ff, 0x00ffff, 0x00ff9f, 0x00b8ff, 0x001eff];
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
  loadPlanes(NUM_HAND_LANDMARKS);
  await initThreeFont();
  waitingHandObj = createTextObj(
    scene,
    "Looking for hands...",
    new THREE.Vector3(canvasWidth / 2, canvasHeight / -2, -2),
    FontNames.Helvetiker,
    20,
    0x00ffff,
    "centre",
    0.9
  );
};

const loadPlanes = (numPlanes) => {
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
        0.8
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
    0.8
  );
  newContent3d.push(handElement);

  ageGenderContent3d = newContent3d;
  ageGenderContent3d.forEach((item) => {
    scene.add(item);
  });
};

const updateAgeGenderContent = () => {
  ageGenderContent3d.forEach((item, index) => {
    item.position.x = hands[0].landmarks[index][0] * 0.01;
    item.position.y = hands[0].landmarks[index][1] * -0.01;
  });
};

const setHandLandmarks = async () => {
  if (!isLoaded) {
    hideLoadingScreen();
    waitingHandObj.updateText("Looking for hands...");
    isLoaded = true;
  }

  if (newHandAppeared) {
    await getAgeGender3dContent();
  }

  if (isHandPresent) {
    waitingHandObj.updateText("");
    updateAgeGenderContent();
    hands[0].landmarks.forEach((landmark, index) => {
      handLandmarks[index].position.x = landmark[0] * 0.01;
      handLandmarks[index].position.y = landmark[1] * -0.01;
    });
  } else {
    waitingHandObj.updateText("Looking for hands...");
  }
};

export { initThreeHands, setHandLandmarks };
