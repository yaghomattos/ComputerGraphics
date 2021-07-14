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
} from '../libs/util/util.js';

import { gerarAviao } from './airplane.js';

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information
var renderer = initRenderer(); // View function in util/utils
renderer.setClearColor('rgb(30, 30, 40)');

var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, -30.0, 10.0);
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 1.0, 0.0);

var trackballControls = new TrackballControls(camera, renderer.domElement);

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

/**
 * Lights -> HemisphereLight, SpotLight and LightSphere (Sol)
 */
var lightSphere = createLightSphere(
  scene,
  100,
  50,
  50,
  new THREE.Vector3(0, 1000, 100)
);
scene.add(lightSphere);

var spotLight = new THREE.SpotLight('rgb(255,255,255)');
spotLight.position.copy(new THREE.Vector3(0, 1000, 100));
spotLight.angle = degreesToRadians(40);
spotLight.castShadow = true;
spotLight.decay = 2;
spotLight.penumbra = 0.5;
spotLight.name = 'Spot Light';
scene.add(spotLight);

var light = new THREE.HemisphereLight();
scene.add(light);

/**
 * wireframe plan
 */
var groundPlane = createGroundPlaneWired(50000, 50000, 100, 100);
groundPlane.rotateX(degreesToRadians(90));
scene.add(groundPlane);

/**
 * axis for reference
 */
var axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

/**
 * airplane
 */
var aviao = gerarAviao();
aviao.translateZ(2);
aviao.translateY(5);
scene.add(aviao);

/**
 * display information on screen
 */
showInformation();

var speedBox = new SecondaryBox('');

/**
 * get keyboard data
 */
var keyboard = new KeyboardState();

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, 0, 50);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

render();

function updateSpeed() {
  speedBox.changeMessage('Speed: ' + (speed * mult).toFixed(2));
}

const speed = 1.0; /* sets the initial speed */
let mult = 5; /* sets initial speed multiplication */
var movement = false; /* movement check */

var angle = degreesToRadians(0.2); /* rotation angle*/
let angulaSpeedVertical = 1;
let angulaSpeedHorizontal = 1;

async function keyboardUpdate() {
  keyboard.update();

  if (keyboard.down('space')) {
    groundPlane.visible = !groundPlane.visible;
    axesHelper.visible = !axesHelper.visible;
  }

  if (movement) cameraHolder.translateY(speed * mult);
  else cameraHolder.translateY(0);

  if (keyboard.pressed('Q') && mult <= 20) {
    mult += 0.1;
    updateSpeed();
    movement = true;
  }
  if (keyboard.pressed('A') && mult > 5) {
    mult -= 0.1;
    updateSpeed();
  }

  if (keyboard.pressed('up') && aviao.rotation.x <= degreesToRadians(1)) {
    cameraHolder.rotateX(-angle * angulaSpeedVertical);
    if (aviao.rotation.x >= degreesToRadians(-20)) {
      aviao.rotation.x += degreesToRadians(-1);
      angulaSpeedVertical += 0.05;
    }
  } else if (
    keyboard.pressed('down') &&
    aviao.rotation.x >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateX(angle * angulaSpeedVertical);
    if (aviao.rotation.x <= degreesToRadians(20)) {
      aviao.rotation.x += degreesToRadians(1);
      angulaSpeedVertical += 0.05;
    }
  } else {
    if (aviao.rotation.x > 0 && aviao.rotation.x <= degreesToRadians(21)) {
      aviao.rotation.x -= degreesToRadians(0.5);
      angulaSpeedVertical = 1;
    }
    if (aviao.rotation.x < 0 && aviao.rotation.x >= degreesToRadians(-21)) {
      aviao.rotation.x += degreesToRadians(0.5);
      angulaSpeedVertical = 1;
    }
  }

  if (keyboard.pressed('left') && aviao.rotation.y <= degreesToRadians(1)) {
    cameraHolder.rotateZ(angle * angulaSpeedHorizontal);
    if (aviao.rotation.y >= degreesToRadians(-50)) {
      aviao.rotation.y += degreesToRadians(-1);
      angulaSpeedHorizontal += 0.05;
    }
  } else if (
    keyboard.pressed('right') &&
    aviao.rotation.y >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateZ(-angle * angulaSpeedHorizontal);
    if (aviao.rotation.y <= degreesToRadians(50)) {
      aviao.rotation.y += degreesToRadians(1);
      angulaSpeedHorizontal += 0.05;
    }
  } else {
    if (aviao.rotation.y > 0 && aviao.rotation.y <= degreesToRadians(51)) {
      aviao.rotation.y -= degreesToRadians(0.5);
      angulaSpeedHorizontal = 1;
    }
    if (aviao.rotation.y < 0 && aviao.rotation.y >= degreesToRadians(-51)) {
      aviao.rotation.y += degreesToRadians(0.5);
      angulaSpeedHorizontal = 1;
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
  renderer.render(scene, camera); // Render scene

  /* Ativar trackballs para melhor visualização do mapa todo */
  //trackballControls.update();

  if (groundPlane.visible) {
    trackballControls.enabled = false;
  } else {
    trackballControls.enabled = true;
    trackballControls.update();
  }
}
