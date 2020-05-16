import * as THREE from "three";
import * as handpose from "@tensorflow-models/handpose";

// const main = () => {
//   requestAnimationFrame(main);
// };
// main();
let hands = [];

async function initCamera() {
  const canvasElement = document.getElementById("webcam-canvas");
  const videoElement = document.getElementById("webcam-video");
  let height = 0;
  let width = 640;
  let streaming = false;

  const setVideoDimensions = () => {
    if (!streaming) {
      width = window.innerWidth;
      height = videoElement.videoHeight / (videoElement.videoWidth / width);

      videoElement.setAttribute("width", width);
      videoElement.setAttribute("height", height);
      canvasElement.setAttribute("width", width);
      canvasElement.setAttribute("height", height);
      streaming = true;
    }
  };
  videoElement.oncanplay = setVideoDimensions;

  const getWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    if (stream) {
      videoElement.srcObject = stream;
    } else {
      alert("Could not load webcam");
    }
  };
  await getWebcam();
}

async function initHandposeDetection() {
  let model = await handpose.load();
  console.log("handpose loaded");

  const estimateHandPose = async () => {
    const canvasElement = document.getElementById("webcam-canvas");
    const videoElement = document.getElementById("webcam-video");
    // if (videoElement.clientWidth == 0) {
    //   return;
    // }
    const context = canvasElement.getContext("2d");
    context.drawImage(
      videoElement,
      0,
      0,
      videoElement.clientWidth,
      videoElement.clientHeight
    );
    // var data = context.getImageData(
    //   0,
    //   0,
    //   videoElement.clientWidth,
    //   videoElement.clientHeight
    // );

    const handEstimate = await model.estimateHands(videoElement);
    if (!handEstimate) {
      return;
    }
    hands = handEstimate;
    // console.log(handEstimate);
    // handEstimate.forEach((hand) => console.log(hand));
  };

  const runDetection = async () => {
    await estimateHandPose();
    requestAnimationFrame(runDetection);
  };
  runDetection();
}

const initThreeCanvas = () => {
  let scene;
  let skyMap;
  let camera;
  let renderer;
  let handLandmarks = [];
  // let clock = new Clock();
  let composer;

  const setHandLandmarks = () => {
    if (hands.length > 0) {
      hands[0].landmarks.forEach((landmark, index) => {
        // console.log(landmark);
        handLandmarks[index].position.x = landmark[0] * 0.01;
        handLandmarks[index].position.y = landmark[1] * 0.01;
      });
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

  const loadPlane = () => {
    const planeMaterial = new THREE.MeshPhysicalMaterial({
      envMap: skyMap,
      color: 0xdddddd,
      metalness: 0,
      roughness: 0.6,
      opacity: 1,
      side: THREE.DoubleSide,
      transparent: false,
      envMapIntensity: 3,
      premultipliedAlpha: true,
    });
    const geometry = new THREE.PlaneBufferGeometry(1, 1);
    for (let i = 0; i < 21; i++) {
      const planeMesh = new THREE.Mesh(geometry, planeMaterial);
      planeMesh.scale.x = 0.2;
      planeMesh.scale.y = 0.2;
      planeMesh.scale.z = 0.2;
      planeMesh.position.z = -1;
      planeMesh.position.x = (i - 5) * 0.5;
      planeMesh.receiveShadow = true;
      scene.add(planeMesh);
      handLandmarks.push(planeMesh);
    }
  };

  const loadOriginLogo = () => {
    const originLogoMaterial = new THREE.MeshPhysicalMaterial({
      envMap: skyMap,
      color: 0x252525,
      metalness: 0,
      roughness: 0,
      opacity: 1,
      side: THREE.DoubleSide,
      transparent: false,
      envMapIntensity: 3,
      premultipliedAlpha: true,
    });

    const objLoader = new OBJLoader2();
    objLoader.load("resources/origin.obj", (object) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = originLogoMaterial;
          child.scale.set(0.25, 0.25, 0.25);
          child.castShadow = true;
        }
      });

      const gridSize = 12;
      const spacing = 0.8;
      for (let i = 0; i < gridSize; i += 1) {
        for (let j = 0; j < gridSize; j += 1) {
          const instance = object.clone();
          instance.position.set(
            (i - gridSize / 2) * spacing,
            (j - gridSize / 2) * spacing,
            0
          );
          scene.add(instance);
          originLogoArray.push(instance);
        }
      }
    });
  };

  const resizeCanvasToDisplaySize = () => {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      canvas.style.width = window.innerWidth;
    }
  };

  const initScene = () => {
    scene = new THREE.Scene();
    const skyMapImages = "img/dark-s_";
    const urls = [
      skyMapImages + "px.jpg",
      skyMapImages + "nx.jpg",
      skyMapImages + "py.jpg",
      skyMapImages + "ny.jpg",
      skyMapImages + "pz.jpg",
      skyMapImages + "nz.jpg",
    ];
    skyMap = new THREE.CubeTextureLoader().load(urls);
    skyMap.mapping = THREE.CubeRefractionMapping;
  };

  const addLights = () => {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6, 100);
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
    camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    camera.rotation.z = Math.PI;
  };

  const initAndAttachCanvas = () => {
    const selfHtmlNode = document.getElementById("mainCanvas");
    renderer = new THREE.WebGLRenderer({ alpha: true });
    selfHtmlNode.appendChild(renderer.domElement);
    renderer.setSize(selfHtmlNode.clientWidth, selfHtmlNode.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    window.addEventListener("resize", () => {
      resizeCanvasToDisplaySize();
    });
  };
  initScene();
  initAndAttachCanvas();
  addCamera();
  loadPlane();
  addLights();
  // addPostProcessing();
  const animate = () => {
    renderer.render(scene, camera);
    setHandLandmarks();
    // composer.render(clock.getDelta());
    requestAnimationFrame(animate);
  };
  animate();
};

const initAll = async () => {
  await initCamera();
  await initHandposeDetection();
  initThreeCanvas();
};

initAll();
