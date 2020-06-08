import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";

const fontLoader = new THREE.FontLoader();

const FontNames = {
  Helvetiker: "Helvetika",
};

let fontFiles = {
  [FontNames.Helvetiker]: "./fonts/helvetiker_regular.typeface.json",
};

let fonts = {
  [FontNames.Helvetiker]: null,
};

let textObjsWithConfig = {};

const initThreeFont = async () => {
  let newFont = await fontLoader.loadAsync(fontFiles[FontNames.Helvetiker]);
  fonts[FontNames.Helvetiker] = newFont;
};

const createTextObj = (
  scene,
  text,
  position,
  fontName = FontNames.Helvetiker,
  fontSize = 20,
  fontColor = 0xffffff,
  fontOpacity = 0.5
) => {
  const textObjName = uuidv4();
  const textGeo = new THREE.TextGeometry(text, {
    font: fonts[fontName],
    size: fontSize,
    bevelEnabled: false,
    curveSegments: 1,
  });
  textGeo.computeBoundingBox();
  var textMaterial = new THREE.MeshBasicMaterial({
    color: fontColor,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: fontOpacity,
  });
  var mesh = new THREE.Mesh(textGeo, textMaterial);
  mesh.position.set(position.x, position.y, position.z);
  mesh.scale.set(0.01, 0.01, 0.01);
  mesh.name = textObjName;

  scene.add(mesh);
  textObjsWithConfig[textObjName] = {
    mesh: mesh,
    font: fonts[fontName],
    fontSize: fontSize,
  };
  return {
    mesh: mesh,
    removeText: () => removeTextByName(scene, textObjName),
    updateText: (text) => updateTextByName(textObjName, text),
  };
};

const removeAllTexts = (scene) => {
  Object.values(textObjsWithConfig).forEach((text) => {
    text.mesh.geometry.dispose();
    text.mesh.material.dispose();
    scene.remove(text.mesh);
  });
  textObjsWithConfig = {};
};

const removeTextByName = (scene, textObjName) => {
  const text = scene.getObjectByName(textObjName);
  if (text) {
    text.geometry.dispose();
    text.material.dispose();
    scene.remove(text);
    textObjsWithConfig[textObjName] = undefined;
  }
};

const updateTextByName = (textObjName, text) => {
  const textObj = textObjsWithConfig[textObjName];
  if (textObj) {
    const newTextGeo = new THREE.TextGeometry(text, {
      font: textObj.font,
      size: textObj.fontSize,
      curveSegments: 1,
      bevelEnabled: false,
    });
    newTextGeo.computeBoundingBox();
    textObj.mesh.geometry.dispose();
    textObj.mesh.geometry = newTextGeo;
  }
};

export { FontNames, createTextObj, initThreeFont, removeAllTexts };
