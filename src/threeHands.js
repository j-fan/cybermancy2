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
  removeAllTexts,
  createTextObjOnly,
} from "./threeTextUtil";
import * as THREE from "three";
import { removeAllImages, loadImageSvg, loadImage } from "./threeImageUtil";

const textColors = [0xff00ff, 0x00ffff, 0x00ff9f, 0x00b8ff, 0x001eff];
let handLandmarks = [];
let ageGenderContent3d = [];
let scene;

let loadedStatus, handElement;

const createText = (text, fontName, fontSize, fontColor) => {
  const newText = createTextObj(
    scene,
    text,
    new THREE.Vector3(1, -2, -2),
    fontName,
    fontSize,
    fontColor
  );
  return newText;
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

const initThreeHands = async (sceneRef) => {
  scene = sceneRef;
  loadPlanes(NUM_HAND_LANDMARKS);
  await initThreeFont();
  loadedStatus = createText("Loading", FontNames.NeonNanoborg, 20, 0xff00ff);
  handElement = createText(
    "Detecting. hand Please wait.",
    FontNames.Helvetiker,
    20,
    0x00ffff
  );
};

const getAgeGender3dContent = async () => {
  if (newHandAppeared) {
    removeAllImages(scene);
    removeAllTexts(scene);
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
          0.8
        );
        newContent3d.push(textObj);
      }
    }
    ageGenderContent3d = newContent3d;
    ageGenderContent3d.forEach((item) => {
      scene.add(item);
    });
  }
};

const setHandLandmarks = async () => {
  await getAgeGender3dContent();
  if (isHandPresent) {
    loadedStatus.updateText("ready");
    handElement.updateText(`${getHandElement()}`);
    loadedStatus.mesh.position.set(
      hands[0].landmarks[0][0] * 0.01,
      hands[0].landmarks[0][1] * -0.01,
      -2
    );

    ageGenderContent3d.forEach((item, index) => {
      item.position.x = hands[0].landmarks[index][0] * 0.01;
      item.position.y = hands[0].landmarks[index][1] * -0.01;
    });

    hands[0].landmarks.forEach((landmark, index) => {
      handLandmarks[index].position.x = landmark[0] * 0.01;
      handLandmarks[index].position.y = landmark[1] * -0.01;
    });
  } else {
    handElement.updateText("No hands found");
  }
};

export { initThreeHands, setHandLandmarks };
