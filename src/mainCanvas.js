import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { SpriteText2D, textAlign } from "three-text2d";
import { hideLoadingScreen } from "./loadingScreen";
import { hands, isHandPresent } from "./handPose";
import { getAgeGenderContent, getHandElement } from "./analyseUser";

const initThreeCanvas = () => {
  let scene;
  let camera;
  let renderer;
  let handLandmarks = [];
  let clock = new THREE.Clock();
  const gltfLoader = new GLTFLoader();
  const fontLoader = new THREE.FontLoader();
  let gltfObjs = [];
  let texts = [];
  let composer;

  const createText = (text) => {
    fontLoader.load("./fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeo = new THREE.TextGeometry("THREE.JS", {
        font: font,
        size: 20, // font size
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
      scene.add(mesh);
      texts.push(mesh);
    });
  };

  const setHandLandmarks = () => {
    getAgeGenderContent();
    if (isHandPresent) {
      // texts[0].text = `${getHandElement()}`;
      hands[0].landmarks.forEach((landmark, index) => {
        handLandmarks[index].position.x = landmark[0] * 0.01;
        handLandmarks[index].position.y = landmark[1] * -0.01;
      });
    } else {
      // texts[0].text = "no hands found";
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

  const loadGltf = (filePath) => {
    gltfLoader.load(filePath, (gltf) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      for (const anim of gltf.animations) {
        mixer.clipAction(anim).play();
      }
      gltfObjs.push({ gltf, mixer });
      scene.add(gltf.scene);
    });
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
  loadPlanes(21);
  addLights();
  // addPostProcessing();
  loadGltf("resources/origin.glb");
  createText("loading...");
  resizeCanvasToDisplaySize();

  let threejsLoaded = false;

  const animate = () => {
    // composer.render(clock.getDelta());
    renderer.render(scene, camera);

    setHandLandmarks();
    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    if (!threejsLoaded) {
      console.log("three js loaded!");
      threejsLoaded = true;
      // texts[0].text = "threejs loaded";
      hideLoadingScreen();
    }

    requestAnimationFrame(animate);
  };
  animate();
};

export default initThreeCanvas;
