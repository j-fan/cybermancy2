import * as THREE from "three";

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

const initThreeFont = async () => {
  let newFont = await fontLoader.loadAsync(fontFiles[FontNames.Helvetiker]);
  fonts[FontNames.Helvetiker] = newFont;
  console.log("fonts loaded", newFont);
};

const generateTextGeo = (text, fontName, fontSize) => {
  console.log("generate text", fonts[fontName]);
  const textGeo = new THREE.TextGeometry(text, {
    font: fonts[fontName],
    size: fontSize,
    curveSegments: 3,
    bevelEnabled: false,
  });
  textGeo.computeBoundingBox();
  var textMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    specular: 0xffffff,
  });
  var mesh = new THREE.Mesh(textGeo, textMaterial);
  mesh.position.set(1, -2, -2);
  mesh.scale.set(0.01, 0.01, 0.01);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export { FontNames, generateTextGeo, initThreeFont };
