import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

let images = [];
const textureLoader = new THREE.TextureLoader();
const svgLoader = new SVGLoader();

const loadImage = async (filename) => {
  try {
    const tex = await textureLoader.loadAsync(filename);
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
    images.push(mesh);
    return mesh;
  } catch (err) {
    console.log(`failed to load image ${filename}`, err);
  }
};

const loadImageSvg = async (
  filename,
  position = new THREE.Vector3(2, -2, -2),
  color = 0x00ffff
) => {
  try {
    const data = await svgLoader.loadAsync(filename);
    const paths = data.paths;
    let group = new THREE.Group();

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const material = new THREE.MeshLambertMaterial({
        color: color,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
        emissive: color,
        transparent: true,
      });
      const shapes = path.toShapes(false, false);
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new THREE.ShapeBufferGeometry(shape);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.001, -0.001, 0.001);
        mesh.position.set(position.x, position.y, position.z);

        group.add(mesh);
      }
    }
    images.push(group);
    return group;
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
