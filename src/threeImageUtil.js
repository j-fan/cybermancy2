import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

let images = [];
const textureLoader = new THREE.TextureLoader();
const svgLoader = new SVGLoader();

const loadImage = async (scene, filename) => {
  try {
    const tex = await textureLoader.loadAsync(filename);
    console.log("tex", tex);
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    });
    const geometry = new THREE.PlaneGeometry(
      tex.image.width * 0.001,
      tex.image.height * 0.001
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2, -2, -2);
    scene.add(mesh);
    images.push(mesh);
  } catch (err) {
    console.log(`failed to load image ${filename}`, err);
  }
};

const loadImageSvg = async (scene, filename) => {
  try {
    const data = await svgLoader.loadAsync(filename);
    const paths = data.paths;
    let group = new THREE.Group();

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const material = new THREE.MeshBasicMaterial({
        color: path.color,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const shapes = path.toShapes(false, false);
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new THREE.ShapeBufferGeometry(shape);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.001, -0.001, 0.001);
        mesh.position.set(2, -2, -2);

        group.add(mesh);
      }
    }

    scene.add(group);
  } catch (err) {
    console.log(`failed to load image ${filename}`, err);
  }
};

const removeAllImages = (scene) => {
  images.forEach((image) => {
    image.geometry.dispose();
    image.material.dispose();
    scene.remove(image);
  });
};

export { loadImage, removeAllImages, loadImageSvg };
