import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";

const fontLoader = new THREE.FontLoader();

const FontNames = {
  Helvetiker: "Helvetika",
  BurgerJoint: "BurgerJoint",
  NeonAbsolute: "NeonAbsolute",
  NeonNanoborg: "NeonNanoborg",
};

let fontFiles = {
  [FontNames.Helvetiker]: "./fonts/helvetiker_regular.typeface.json",
  [FontNames.BurgerJoint]: "./fonts/Burger_Joint.json",
  [FontNames.NeonAbsolute]: "./fonts/Neon_Absolute.json",
  [FontNames.NeonNanoborg]: "./fonts/Neon_Nanoborg.json",
};

let fonts = {};

let textObjsWithConfig = {};

const initThreeFont = async () => {
  for await (let fontName of Object.keys(fontFiles)) {
    const fileName = fontFiles[fontName];
    const loadedFont = await fontLoader.loadAsync(fileName);
    fonts[fontName] = loadedFont;
  }
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
  if (
    fontName === FontNames.NeonAbsolute ||
    fontName === FontNames.Helvetiker
  ) {
    mesh.scale.set(0.005, 0.005, 0.005);
  } else {
    mesh.scale.set(0.01, 0.01, 0.01);
  }
  mesh.name = textObjName;

  scene.add(mesh);
  textObjsWithConfig[textObjName] = {
    mesh: mesh,
    font: fonts[fontName],
    fontSize: fontSize,
    text: text,
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
    if (text === textObj.text) {
      return;
    }
    const newTextGeo = new THREE.TextGeometry(text, {
      font: textObj.font,
      size: textObj.fontSize,
      curveSegments: 1,
      bevelEnabled: false,
    });
    newTextGeo.computeBoundingBox();
    textObj.mesh.geometry.dispose();
    textObj.mesh.geometry = newTextGeo;
    textObj.text = text;
  }
};

export { FontNames, createTextObj, initThreeFont, removeAllTexts };
