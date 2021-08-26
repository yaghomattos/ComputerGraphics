import * as THREE from '../build/three.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import {
  initRenderer,
  InfoBox,
  SecondaryBox,
  createGroundPlaneWired,
  onWindowResize,
  degreesToRadians,
  createLightSphere,
  initDefaultBasicLight,
} from '../libs/util/util.js';

import { generateTrack } from './track.js';
import { createCheckpoints } from './track.js';
import { getRadius } from './track.js';

import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';

var checkpointsCount = 0;

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information
var renderer = initRenderer(); // View function in util/utils
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, -90.0, 10.0);
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 1.0, 0.0);

var camera2 = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

/* sets the position of the camera at the backward of the plane */
camera2.position.set(0.0, -30.0, 10.0);
camera2.lookAt(0.0, 0.0, 0.0);
camera2.up.set(0.0, 1.0, 0.0);

var inspecScene = new THREE.Scene();
initDefaultBasicLight(inspecScene);
var aviaoInspec = new THREE.Object3D();
var planeInspec = new THREE.Object3D();
planeInspec.add(aviaoInspec);
planeInspec.position.set(0, 0, 0);
inspecScene.add(planeInspec);

var trackballControls = new TrackballControls(camera2, renderer.domElement);

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

/**
 * axis for reference
 */
var axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

/**
 * Lights -> HemisphereLight, SpotLight and LightSphere (Sum)
 */
var sum = createLightSphere(
  scene,
  1000,
  100,
  100,
  new THREE.Vector3(10000, 25000, 5000)
);
scene.add(sum);

var dirLight = new THREE.DirectionalLight('rgb(255,255,150)');
dirLight.position.set(0, 1, 0);
dirLight.castShadow = true;    
dirLight.shadow.bias = -0.0001;
dirLight.shadow.camera.far = 5500;
dirLight.shadow.mapSize.width = 1024 * 6;
dirLight.shadow.mapSize.height = 1024 * 6;
dirLight.shadow.camera.left = -2500;
dirLight.shadow.camera.right = 2500;
dirLight.shadow.camera.top = 2500;
dirLight.shadow.camera.bottom = -2500;   
scene.add(dirLight);

var light = new THREE.HemisphereLight(0xffffff, 0x2b2b2b);
scene.add(light);

/**
 * wireframe plan
 */
var groundPlane = createGroundPlaneWired(
  50000,
  50000,
  100,
  100,
  'rgb(34,139,34)'
);
groundPlane.rotateX(degreesToRadians(90));
groundPlane.receiveShadow = true;
scene.add(groundPlane);

/**
 * airplane
 */
var aviao = new THREE.Object3D();
aviao.position.set(0, 0, 2);

loadOBJFile('./assets/', '14 bis', 2, 0, true, aviao);

/**
 * Track
 */
var track = generateTrack();
track.castShadow = true;
scene.add(track);

var checkpoints = createCheckpoints();

for (let i = 0; i < checkpoints.length; i++) {
  var check = checkpoints[i];
  check.castShadow = true;
  scene.add(check);
}

/**
 * cenario
 */
var cenario;

loadOBJFile('./assets/', 'cenario', 2, 0, true, cenario);

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, -1000, 0);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

var showInfoBox = false;

if(showInfoBox) {
  console.log(showInfoBox)
  showInformation();
}  

var speedBox = new SecondaryBox('');

var maxSpeedBox = new SecondaryBox('');
maxSpeedBox.box.style.left = '225px';
maxSpeedBox.box.style.display = 'none';

var timeBox = new SecondaryBox('');
timeBox.box.style.bottom = '50px';

var checkBox = new SecondaryBox('');
checkBox.box.style.bottom = '100px';

var keyboard = new KeyboardState();

render();

/* timer */
var timer = new THREE.Clock();
var delta = 0;

function updateTime(stop) {
  if (latest) timer.stop();
  delta += timer.getDelta();
  timeBox.changeMessage(' Time: ' + delta.toFixed(2));
}

/* message speed */
function updateSpeed() {
  speedBox.changeMessage('Speed: ' + Math.pow(mult, 2).toFixed(0) + ' km/h');
  if (Math.pow(mult, 2) > 41) {
    maxSpeedBox.changeMessage('MAX');
    maxSpeedBox.box.style.display = 'block';
  } else {
    maxSpeedBox.changeMessage('');
    maxSpeedBox.box.style.display = 'none';
  }
}

function updateCheckedpoint() {
  checkBox.changeMessage('Checkpoint(s): ' + checkpointsCount);
}

var sim = true;
var cockpit = false;

function cameraCockpit() {
  if (cockpit) {
    camera.position.set(0, 0.5, 4);
  } else camera.position.set(0, -30, 10);
}

const speed = 1.0; /* sets the initial speed */
var mult = 2; /* sets initial speed multiplication */
var movement = false; /* movement check */
var angularSpeedVertical = 0.317;
var angularSpeedHorizontal = 0.00238;

var animation = degreesToRadians(0.1587);
var modeCam2 = false;
var started = false;

var latest = false;

async function keyboardUpdate() {
  keyboard.update();

  if (modeCam2) {
    movement = false;
    /* invisible secondaryBox */
    speedBox.box.style.display = 'none';
    timeBox.box.style.display = 'none';
    maxSpeedBox.box.style.display = 'none';
    checkBox.box.style.display = 'none';
  } else {
    /* visible secondaryBox */
    speedBox.box.style.display = 'block';
    timeBox.box.style.display = 'block';
    maxSpeedBox.box.style.display = 'block';
    checkBox.box.style.display = 'block';
  }

  var radiusCheckpoint = getRadius();

  for (var i = 0; i < checkpoints.length; i++) {
    var inicioX = checkpoints[i].position.x;
    var inicioY = checkpoints[i].position.y;
    var inicioZ = checkpoints[i].position.z;

    var aviaoX = cameraHolder.position.x;
    var aviaoY = cameraHolder.position.y;
    var aviaoZ = cameraHolder.position.z;

    if (
      aviaoX > inicioX - radiusCheckpoint &&
      aviaoX < inicioX + radiusCheckpoint &&
      aviaoY > inicioY - radiusCheckpoint &&
      aviaoY < inicioY + radiusCheckpoint &&
      aviaoZ > inicioZ - radiusCheckpoint &&
      aviaoZ < inicioZ + radiusCheckpoint
    ) {
      if (i == 0) {
        started = true;
        updateTime();
        if (checkpoints[i].visible == true) {
          checkpointsCount++;
          updateCheckedpoint();
        }
        checkpoints[i].visible = false;
      } else {
        if (checkpoints[i].visible == true) {
          checkpointsCount++;
          updateCheckedpoint();
        }
        checkpoints[i].visible = false;
      }
    }
    if (!checkpoints[12].visible && !latest) {
      updateTime(stop);
      latest = true;
    }
  }

  if (started) updateTime();

  if (keyboard.down('space')) {
    mult = 0;
    sim = !sim;
    modeCam2 = !modeCam2;

    if (!modeCam2) mult = 2;
  }

  if (keyboard.down('enter') && initialize === true) {
    track.visible = !track.visible;
  }

  if (keyboard.down('C')) {
    cockpit = !cockpit;
  }

  if (movement) {
    aviao.translateY(0);
    cameraHolder.translateY(speed * mult);
  }

  if (keyboard.pressed('Q') && mult < 6.4) {
    mult += 0.1;
    updateSpeed();
    movement = true;
  }
  if (keyboard.pressed('A') && mult > 2.1) {
    mult -= 0.1;
    updateSpeed();
  }

  if (keyboard.pressed('up') && aviao.rotation.x <= degreesToRadians(1)) {
    cameraHolder.translateZ(-angularSpeedVertical * mult);
    if (aviao.rotation.x >= degreesToRadians(-15)) {
      aviao.rotation.x -= animation * mult;
    }
  } else if (
    keyboard.pressed('down') &&
    aviao.rotation.x >= degreesToRadians(-1)
  ) {
    cameraHolder.translateZ(angularSpeedVertical * mult);
    if (aviao.rotation.x <= degreesToRadians(15)) {
      aviao.rotation.x += animation * mult;
    }
  } else {
    if (aviao.rotation.x > 0 && aviao.rotation.x <= degreesToRadians(22)) {
      aviao.rotation.x -= degreesToRadians(0.5);
    }
    if (aviao.rotation.x < 0 && aviao.rotation.x >= degreesToRadians(-22)) {
      aviao.rotation.x += degreesToRadians(0.5);
    }
  }

  if (keyboard.pressed('left') && aviao.rotation.y <= degreesToRadians(1)) {
    cameraHolder.rotateZ(angularSpeedHorizontal * mult);
    if (aviao.rotation.y >= degreesToRadians(-25)) {
      aviao.rotation.y -= animation * mult;
    }
  } else if (
    keyboard.pressed('right') &&
    aviao.rotation.y >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateZ(-angularSpeedHorizontal * mult);
    if (aviao.rotation.y <= degreesToRadians(25)) {
      aviao.rotation.y += animation * mult;
    }
  } else {
    if (aviao.rotation.y > 0 && aviao.rotation.y <= degreesToRadians(40)) {
      aviao.rotation.y -= degreesToRadians(0.6);
    }
    if (aviao.rotation.y < 0 && aviao.rotation.y >= degreesToRadians(-40)) {
      aviao.rotation.y += degreesToRadians(0.6);
    }
  }
}

function showInformation() {
  // Use this to show information onscreen
  var controls = new InfoBox();
  controls.add('Controls');
  controls.addParagraph();
  controls.add('Space to change camera mode');
  controls.add('C for cockpit camera');
  controls.add('Q to speed up');
  controls.add('A to speed down');
  controls.add('Up/Down arrow to elevator');
  controls.add('Left / Right arrow to turn');
  controls.add('Enter to show/hide track');
  controls.show();
}

var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(90, 1280 / 720, 0.1, 100),
};

function checkInit() {
  if (resourcesLoaded && keyboard.down('enter')) {
    initialize = true;
  }
}

var initialize = false;
var resourcesLoaded = false;

function loadOBJFile(modelPath, modelName, visibility) {
  // console.log('começando');
  var manager = new THREE.LoadingManager();

  manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(
      'Started loading file: ' +
        url +
        '.\nLoaded ' +
        itemsLoaded +
        ' of ' +
        itemsTotal +
        ' files.'
    );
  };

  manager.onLoad = function () {
    console.log('Loading complete!');
  };

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log(
      'Loading file: ' +
        url +
        '.\nLoaded ' +
        itemsLoaded +
        ' of ' +
        itemsTotal +
        ' files.'
    );
    if (itemsLoaded === itemsTotal) {
      resourcesLoaded = true;
    }
  };

  manager.onError = function (url) {
    console.log('There was an error loading ' + url);
  };

  var mtlLoader = new MTLLoader(manager);
  mtlLoader.setPath(modelPath);
  mtlLoader.load(modelName + '.mtl', function (materials) {
    materials.preload();
    // console.log('materiais carregados');

    var objLoader = new OBJLoader(manager);
    objLoader.setMaterials(materials);
    objLoader.setPath(modelPath);
    objLoader.load(modelName + '.obj', function (obj) {
      // console.log('objeto carregado, sendo processado');
      obj.visible = visibility;
      obj.name = modelName;
      // Set 'castShadow' property for each children of the group
      obj.castShadow = true;
      obj.traverse(function (child) {
        // console.log('carregando...');
        child.castShadow = false;
      });

      obj.traverse(function (node) {
        // console.log('carregando(2)...');
        if (node.material) node.material.side = THREE.DoubleSide;
      });
      // console.log('finalizado');

      /*
        var obj = normalizeAndRescale(obj, desiredScale);
        console.log("1")
        var obj = fixPosition(obj);
        console.log("2")
        obj.rotateY(degreesToRadians(angle));
        */
      // console.log('obj: ');
      // console.log(obj);

      if (modelName == 'cenario') {
        // console.log('começando a adicionar');
        obj.rotateX(Math.PI / 2);
        obj.rotateY((-Math.PI * 2) / 3 + Math.PI / 2 - Math.PI / 6);
        obj.translateZ(-600);
        obj.translateX(-200);
        scene.add(obj);
        // console.log('adicionado à cena');
      }
      if (modelName == '14 bis') {
        // console.log('adicionando ao objeto');
        aviao.add(obj);
        // console.log('adicionando ao modelo de inspeção');
        aviaoInspec.copy(aviao, true);
        obj.rotateX(Math.PI / 2);
        obj.rotateY(Math.PI / 2);
        //        obj.rotateZ(Math.PI/2);
        // console.log('adicionado');
      }
    });
  });
}

function loading() {
  renderer.setClearColor('rgb(0, 0, 0)');
  speedBox.box.style.display = 'none';
  timeBox.box.style.display = 'none';
  maxSpeedBox.box.style.display = 'none';
  checkBox.box.style.display = 'none';
  showInfoBox = false;
}

function flightSim() {
  renderer.setClearColor('rgb(135, 206, 235)');
  showInfoBox = true;
}

function render() {
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  if (initialize === false) {
    renderer.render(loadingScreen.scene, loadingScreen.camera);
    loading();
    checkInit();
  } else {
    flightSim();
    if (sim) renderer.render(scene, camera);
    else renderer.render(inspecScene, camera2);
  }
  cameraCockpit();
  trackballControls.update();
}
