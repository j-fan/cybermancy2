import * as THREE from "three";

let images = [];
const loader = new THREE.TextureLoader();

const loadImage = async (scene, filename) => {
  const tex = await loader.loadAsync(filename);
  console.log("tex", tex);
  const material = new THREE.MeshLambertMaterial({
    map: tex,
  });
  const geometry = new THREE.PlaneGeometry(10, 10 * 0.75);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);
  images.push(mesh);
};

const removeAllImages = (scene) => {
  images.forEach((image) => {
    image.geometry.dispose();
    image.material.dispose();
    scene.remove(image);
  });
};

export { loadImage, removeAllImages };
