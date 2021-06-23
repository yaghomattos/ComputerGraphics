import * as THREE from '../build/three.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import {
  initRenderer,
  InfoBox,
  createGroundPlaneWired,
  initDefaultBasicLight,
  onWindowResize,
  degreesToRadians,
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
  1000
);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, -30.0, 10.0);
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 1.0, 0.0);

var trackballControls = new TrackballControls(camera, renderer.domElement);

/**
 * simple light
 */
initDefaultBasicLight(scene);

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

/**
 * wireframe plan
 */
var groundPlane = createGroundPlaneWired(2000, 2000);
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
scene.add(aviao);

/**
 * display information on screen
 */
showInformation();

/**
 * get keyboard data
 */
var keyboard = new KeyboardState();

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, 0, 0);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

render();

const speed = 1.0; /* sets the initial speed */
let mult = 0.8; /* sets initial speed multiplication */
var verification = false; /* movement check */

var angle = degreesToRadians(0.4); /* rotation angle*/

async function keyboardUpdate() {
  keyboard.update();

  if (keyboard.down('enter')) {
    verification = !verification;
  }

  if (keyboard.down('space')) {
    groundPlane.visible = !groundPlane.visible;
    axesHelper.visible = !axesHelper.visible;
    if (groundPlane.visible) {
      location.reload();
    }
  }

  if (verification) cameraHolder.translateY(speed * mult);

  if (keyboard.pressed('Q') && mult <= 8) {
    mult += 0.05;
  }
  if (keyboard.pressed('A') && mult > 0.5) {
    mult -= 0.05;
  }

  if (keyboard.pressed('up') && aviao.rotation.x <= degreesToRadians(1)) {
    cameraHolder.rotateX(-angle);
    if (aviao.rotation.x >= degreesToRadians(-20)) {
      aviao.rotation.x += degreesToRadians(-1);
    }
  } else if (keyboard.pressed('down') && aviao.rotation.x >= degreesToRadians(-1)) {
    cameraHolder.rotateX(angle);
    if (aviao.rotation.x <= degreesToRadians(20)) {
      aviao.rotation.x += degreesToRadians(1);
    }
  } else {
    if (aviao.rotation.x > 0 && aviao.rotation.x <= degreesToRadians(21)) {
      aviao.rotation.x -= degreesToRadians(0.5);
    }
    if (aviao.rotation.x < 0 && aviao.rotation.x >= degreesToRadians(-21)) {
      aviao.rotation.x += degreesToRadians(0.5);
    }
  }

  if (keyboard.pressed('left') && aviao.rotation.y <= degreesToRadians(1)) {
    cameraHolder.rotateZ(angle);
    if (aviao.rotation.y >= degreesToRadians(-45)) {
      aviao.rotation.y += degreesToRadians(-1);
    }
  } else if (
    keyboard.pressed('right') &&
    aviao.rotation.y >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateZ(-angle);
    if (aviao.rotation.y <= degreesToRadians(45)) {
      aviao.rotation.y += degreesToRadians(1);
    }
  } else {
    if (aviao.rotation.y > 0 && aviao.rotation.y <= degreesToRadians(46)) {
      aviao.rotation.y -= degreesToRadians(0.5);
    }
    if (aviao.rotation.y < 0 && aviao.rotation.y >= degreesToRadians(-46)) {
      aviao.rotation.y += degreesToRadians(0.5);
    }
  }
}

function showInformation() {
  // Use this to show information onscreen
  var controls = new InfoBox();
  controls.add('Controls');
  controls.addParagraph();
  controls.add('Enter to start moving');
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

  if (groundPlane.visible) {
    trackballControls.enabled = false;
  } else {
    trackballControls.enabled = true;
    trackballControls.update();
  }
}
