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

const formatTextWrap = (text, maxLineLength) => {
  const words = text.replace(/[\r\n]+/g, " ").split(" ");
  let lineLength = 0;

  return words.reduce((result, word) => {
    if (lineLength + word.length >= maxLineLength) {
      lineLength = word.length;
      return result + `\n${word}`;
    } else {
      lineLength += word.length + (result ? 1 : 0);
      return result ? result + ` ${word}` : `${word}`;
    }
  }, "");
};

const createTextObj = (
  scene,
  text,
  position,
  fontName = FontNames.Helvetiker,
  fontSize = 20,
  fontColor = 0xffffff,
  alignment = "left",
  fontOpacity = 0.5,
  maxLineLength = 30
) => {
  const mesh = createTextObjOnly(
    text,
    position,
    fontName,
    fontSize,
    fontColor,
    alignment,
    fontOpacity,
    maxLineLength
  );
  scene.add(mesh);
  return {
    mesh: mesh,
    removeText: () => removeTextByName(scene, mesh.name),
    updateText: (text) => updateTextByName(mesh.name, text, alignment),
  };
};

const alignText = (geo, alignment) => {
  if (!geo.boundingBox) {
    geo.computeBoundingBox();
  }
  if (alignment === "centre") {
    THREE.GeometryUtils.center(geo);
  } else if (alignment === "left") {
    geo.applyMatrix(
      new THREE.Matrix4().makeTranslation(-geo.boundingBox.getSize().x, 0, 0)
    );
  }
};

const createTextObjOnly = (
  text,
  position,
  fontName = FontNames.Helvetiker,
  fontSize = 20,
  fontColor = 0xffffff,
  alignment = "left",
  fontOpacity = 0.5,
  maxLineLength = 30
) => {
  const textObjName = uuidv4();
  const textGeo = new THREE.TextGeometry(formatTextWrap(text, maxLineLength), {
    font: fonts[fontName],
    size: fontSize,
    bevelEnabled: false,
    curveSegments: 1,
  });
  alignText(textGeo, alignment);
  const textMaterial = new THREE.MeshBasicMaterial({
    color: fontColor,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: fontOpacity,
  });
  const mesh = new THREE.Mesh(textGeo, textMaterial);
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

  textObjsWithConfig[textObjName] = {
    mesh: mesh,
    font: fonts[fontName],
    fontSize: fontSize,
    text: text,
  };
  return mesh;
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

const updateTextByName = (textObjName, text, alignment) => {
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
    alignText(newTextGeo, alignment);
    textObj.mesh.geometry.dispose();
    textObj.mesh.geometry = newTextGeo;
    textObj.text = text;
  }
};

export {
  FontNames,
  createTextObj,
  initThreeFont,
  removeAllTexts,
  createTextObjOnly,
};
