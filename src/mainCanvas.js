import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { hideLoadingScreen } from "./loadingScreen";
import { hands, isHandPresent, NUM_HAND_LANDMARKS } from "./handPose";
import { getAgeGenderContent, getHandElement } from "./analyseUser";
import { initThreeFont, createTextObj, FontNames } from "./threeTextUtil";
import { loadImage, loadImageSvg } from "./threeImageUtil";

const initThreeCanvas = async () => {
  let scene;
  let camera;
  let renderer;
  let handLandmarks = [];
  let clock = new THREE.Clock();
  const gltfLoader = new GLTFLoader();
  let gltfObjs = [];
  let composer;

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

  const setHandLandmarks = () => {
    getAgeGenderContent();
    if (isHandPresent) {
      loadedStatus.updateText("ready");
      handElement.updateText(`${getHandElement()}`);
      loadedStatus.mesh.position.set(
        hands[0].landmarks[0][0] * 0.01,
        hands[0].landmarks[0][1] * -0.01,
        -2
      );
      hands[0].landmarks.forEach((landmark, index) => {
        handLandmarks[index].position.x = landmark[0] * 0.01;
        handLandmarks[index].position.y = landmark[1] * -0.01;
      });
    } else {
      handElement.updateText("No hands found");
    }
  };

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

  const loadPlanes = (numPlanes) => {
    const planeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdddddd,
      metalness: 0,
      roughness: 0,
      opacity: 1,
      side: THREE.DoubleSide,
      transparent: false,
      premultipliedAlpha: true,
    });
    const geometry = new THREE.PlaneBufferGeometry(1, 1);
    for (let i = 0; i < numPlanes; i++) {
      const planeMesh = new THREE.Mesh(geometry, planeMaterial);
      planeMesh.scale.x = 0.2;
      planeMesh.scale.y = 0.2;
      planeMesh.scale.z = 0.2;
      planeMesh.position.z = -1;
      planeMesh.position.x = (i - numPlanes / 2) * 0.5;
      planeMesh.receiveShadow = true;
      scene.add(planeMesh);
      handLandmarks.push(planeMesh);
    }
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

  loadPlanes(NUM_HAND_LANDMARKS);
  await initThreeFont();
  loadedStatus = createText("Loading", FontNames.NeonNanoborg, 20, 0xff00ff);
  handElement = createText(
    "Detecting. hand Please wait.",
    FontNames.Helvetiker,
    20,
    0x00ffff
  );

  await loadGltf("resources/origin.glb");

  resizeCanvasToDisplaySize();
  await loadImageSvg(scene, "logos/buzznet.svg");
  hideLoadingScreen();

  const animate = () => {
    // composer.render(clock.getDelta());
    renderer.render(scene, camera);

    setHandLandmarks();
    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    requestAnimationFrame(animate);
  };
  animate();
};

export default initThreeCanvas;
