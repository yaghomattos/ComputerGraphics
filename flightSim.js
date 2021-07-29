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

import { gerarAviao } from './airplane.js';
import { generateTrack } from './track.js';
import { createCheckpoints } from './track.js';
import { getRadius } from './track.js';

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information
var renderer = initRenderer(); // View function in util/utils
renderer.setClearColor('rgb(135, 206, 235)');

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

var aviaoInspec = gerarAviao();
aviaoInspec.rotateZ(degreesToRadians(180));
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

var dirLight = new THREE.DirectionalLight("rgb(255,255,150)");
dirLight.position.copy(new THREE.Vector3(10000, 25000, 5000));
dirLight.shadow.bias = 0.0001;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.castShadow = true;
dirLight.shadow.camera.left = -200;
dirLight.shadow.camera.right = 200;
dirLight.shadow.camera.top = 200;
dirLight.shadow.camera.bottom = -200;
scene.add(dirLight);


var light = new THREE.HemisphereLight(0xffffff, 0x2b2b2b);
scene.add(light);

/**
 * wireframe plan
 */
var groundPlane = createGroundPlaneWired(50000, 50000, 100, 100, "rgb(80,85,90)");
groundPlane.rotateX(degreesToRadians(90));
scene.add(groundPlane);

/**
 * airplane
 */
var aviao = gerarAviao();
aviao.translateZ(2);
aviao.translateY(5);

/**
 * Track
 */
var track = generateTrack();
scene.add(track);

var checkpoints = createCheckpoints();

for (let i = 0; i < checkpoints.length; i++) {
  var check = checkpoints[i];
  scene.add(check);
}

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, -500, 0);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

showInformation();

var speedBox = new SecondaryBox('');

var maxSpeedBox = new SecondaryBox('');
maxSpeedBox.box.style.left = '225px';
maxSpeedBox.box.style.display = 'none';

var timeBox = new SecondaryBox('');
timeBox.box.style.bottom = '50px';

var keyboard = new KeyboardState();

render();

/* timer */
var timer = new THREE.Clock();
var delta = 0;

function updateTime() {
  delta += timer.getDelta();
  timeBox.changeMessage(' Time: ' + delta.toFixed(2));
}

/* message speed */
function updateSpeed() {
  speedBox.changeMessage('Speed: ' + (speed * mult * 48).toFixed(0) + ' km/h');
  if (speed * mult * 48 >= 839) {
    maxSpeedBox.changeMessage('MAX');
    maxSpeedBox.box.style.display = 'block';
  } else {
    maxSpeedBox.changeMessage('');
    maxSpeedBox.box.style.display = 'none';
  }
}

var sim = true;
var cockpit = false;

function cameraCockpit() {
  if (cockpit) {
    camera.position.set(0, 5, 4);
  } else camera.position.set(0, -30, 10);
}

const speed = 1.0; /* sets the initial speed */
var mult = 5; /* sets initial speed multiplication */
var movement = false; /* movement check */
var angle = degreesToRadians(0.3); /* angle rotation */
var angularSpeedVertical = 2;
var angularSpeedHorizontal = 0.015;

var animation = degreesToRadians(1);
var modeCam2 = false;
var started = false;

async function keyboardUpdate() {
  keyboard.update();

  if (modeCam2) {
    movement = false;
    /* invisible secondaryBox */
    speedBox.box.style.display = 'none';
    timeBox.box.style.display = 'none';
  } else {
    /* visible secondaryBox */
    speedBox.box.style.display = 'block';
    timeBox.box.style.display = 'block';
  }

  var radiusCheckpoint = getRadius();

  var inicioX = checkpoints[0].position.x;
  var inicioY = checkpoints[0].position.y;
  var inicioZ = checkpoints[0].position.z;

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
    started = true;
    updateTime();
  }

  if (started) updateTime();

  if (keyboard.down('space')) {
    mult = 0;
    sim = !sim;
    modeCam2 = !modeCam2;

    if (!modeCam2) mult = 5;
  }

  if (keyboard.down('enter')) {
    track.visible = !track.visible;
  }

  if (keyboard.down('C')) {
    cockpit = !cockpit;
  }

  if (movement) {
    aviao.translateY(0);
    cameraHolder.translateY(speed * mult);
  }

  if (keyboard.pressed('Q') && mult < 17.4) {
    mult += 0.1;
    updateSpeed();
    movement = true;
  }
  if (keyboard.pressed('A') && mult > 5.1) {
    mult -= 0.1;
    updateSpeed();
  }

  if (keyboard.pressed('up') && aviao.rotation.x <= degreesToRadians(1)) {
    cameraHolder.translateZ(-angularSpeedVertical);
    if (aviao.rotation.x >= degreesToRadians(-20)) {
      aviao.rotation.x -= animation;
    }
  } else if (
    keyboard.pressed('down') &&
    aviao.rotation.x >= degreesToRadians(-1)
  ) {
    cameraHolder.translateZ(angularSpeedVertical);
    if (aviao.rotation.x <= degreesToRadians(20)) {
      aviao.rotation.x += animation;
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
    cameraHolder.rotateZ(angularSpeedHorizontal);
    if (aviao.rotation.y >= degreesToRadians(-35)) {
      aviao.rotation.y -= animation;
    }
  } else if (
    keyboard.pressed('right') &&
    aviao.rotation.y >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateZ(-angularSpeedHorizontal);
    if (aviao.rotation.y <= degreesToRadians(35)) {
      aviao.rotation.y += animation;
    }
  } else {
    if (aviao.rotation.y > 0 && aviao.rotation.y <= degreesToRadians(40)) {
      aviao.rotation.y -= degreesToRadians(0.5);
    }
    if (aviao.rotation.y < 0 && aviao.rotation.y >= degreesToRadians(-40)) {
      aviao.rotation.y += degreesToRadians(0.5);
    }
  }
}

function showInformation() {
  // Use this to show information onscreen
  var controls = new InfoBox();
  controls.add('Controls');
  controls.addParagraph();
  controls.add('Space to change camera mode');
  controls.add('Q to speed up');
  controls.add('A to speed down');
  controls.add('Up/Down arrow to elevator');
  controls.add('Left / Right arrow to turn');
  controls.show();
}

function render() {
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  if (sim) renderer.render(scene, camera);
  else renderer.render(inspecScene, camera2);

  cameraCockpit();
  trackballControls.update();
}
