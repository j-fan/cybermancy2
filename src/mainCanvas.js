import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { hideLoadingScreen } from "./loadingScreen";
import { initThreeHands, setHandLandmarks } from "./threeHands";

const initThreeCanvas = async () => {
  let scene;
  let camera;
  let renderer;
  let clock = new THREE.Clock();
  const gltfLoader = new GLTFLoader();
  let gltfObjs = [];
  let composer;

  const addPostProcessing = () => {
    composer = new EffectComposer(renderer);

    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.COLOR_DODGE,
    });
    noiseEffect.blendMode.opacity.value = 0.05;

    const chromaticAbberationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.001, 0.003),
    });

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, noiseEffect));
    composer.addPass(new EffectPass(camera, chromaticAbberationEffect));
  };

  const loadGltf = async (filePath) => {
    const gltf = await gltfLoader.loadAsync(filePath);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    for (const anim of gltf.animations) {
      mixer.clipAction(anim).play();
    }
    gltfObjs.push({ gltf, mixer });
    scene.add(gltf.scene);
  };

  const resizeCanvasToDisplaySize = () => {
    const canvas = renderer.domElement;
    const videoElement = document.getElementById("webcam-video");
    const width = videoElement.clientWidth;
    const height = videoElement.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  };

  const initScene = () => {
    scene = new THREE.Scene();
    let pmremGenerator = new THREE.PMREMGenerator(renderer);

    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load("img/royal_esplanade_1k.hdr", (hdrEquirect) => {
        let hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(
          hdrEquirect
        );
        hdrEquirect.dispose();
        pmremGenerator.dispose();

        // scene.background = hdrCubeRenderTarget.texture;
        scene.environment = hdrCubeRenderTarget.texture;
      });

    pmremGenerator.compileEquirectangularShader();
  };

  const addLights = () => {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1, 100);
    directionalLight.position.set(0, 5, 10);
    scene.add(directionalLight);
    directionalLight.castShadow = true;
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.height = 256;
    directionalLight.shadow.mapSize.width = 256;
    directionalLight.shadow.camera = new THREE.OrthographicCamera(
      -6,
      6,
      6,
      -6,
      8,
      20
    );
    // const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(cameraHelper);
  };

  const addCamera = () => {
    const videoElement = document.getElementById("webcam-video");
    const width = videoElement.videoWidth * 0.01;
    const height = videoElement.videoHeight * 0.01;
    camera = new THREE.OrthographicCamera(0, width, 0, -height, 0.1, 1000);
  };

  const initAndAttachCanvas = () => {
    const selfHtmlNode = document.getElementById("mainCanvas");
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    selfHtmlNode.appendChild(renderer.domElement);
    renderer.setSize(selfHtmlNode.clientWidth, selfHtmlNode.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    window.addEventListener("resize", () => {
      resizeCanvasToDisplaySize();
    });
  };

  initAndAttachCanvas();
  initScene();
  addCamera();
  addLights();
  // addPostProcessing();
  await initThreeHands(scene);
  await loadGltf("resources/origin.glb");

  resizeCanvasToDisplaySize();
  hideLoadingScreen();

  const animate = async () => {
    // composer.render(clock.getDelta());
    renderer.render(scene, camera);

    await setHandLandmarks();
    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    requestAnimationFrame(animate);
  };
  animate();
};

export default initThreeCanvas;
