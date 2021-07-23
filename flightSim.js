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
import { generateTrack } from './track.js';

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
 * axis for reference
 */
var axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

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
 * airplane
 */
var aviao = gerarAviao();
aviao.translateZ(2);
aviao.translateY(5);
scene.add(aviao);

/**
 * Track
 */
var track = generateTrack();
track.position.set(0, 0, 10);
scene.add(track);

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, 0, 50);
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
  if (speed * mult * 48 >= 840) {
    maxSpeedBox.changeMessage('MAX');
    maxSpeedBox.box.style.display = 'block';
  } else {
    maxSpeedBox.changeMessage('');
    maxSpeedBox.box.style.display = 'none';
  }
}

var sim = false;

var planePosition = {
  position: { x: aviao.position.x, y: aviao.position.y, z: aviao.position.z },
  rotation: { x: aviao.rotation.x, y: aviao.rotation.y, z: aviao.rotation.z },
};

var cameraPosition = {
  position: {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  },
  rotation: {
    x: camera.rotation.x,
    y: camera.rotation.y,
    z: camera.rotation.z,
  },
  up: { x: camera.up.x, y: camera.up.y, z: camera.up.z },
};

var cameraHolderPosition = {
  position: {
    x: cameraHolder.position.x,
    y: cameraHolder.position.y,
    z: cameraHolder.position.z,
  },
  rotation: {
    x: cameraHolder.rotation.x,
    y: cameraHolder.rotation.y,
    z: cameraHolder.rotation.z,
  },
};

function mudaCamera() {
  if (!sim) {
    planePosition.position.x = aviao.position.x;
    planePosition.position.y = aviao.position.y;
    planePosition.position.z = aviao.position.z;

    planePosition.rotation.x = aviao.rotation.x;
    planePosition.rotation.y = aviao.rotation.y;
    planePosition.rotation.z = aviao.rotation.z;

    cameraPosition.position.x = camera.position.x;
    cameraPosition.position.y = camera.position.y;
    cameraPosition.position.z = camera.position.z;

    cameraPosition.rotation.x = camera.rotation.x;
    cameraPosition.rotation.y = camera.rotation.y;
    cameraPosition.rotation.z = camera.rotation.z;

    cameraPosition.up.x = camera.up.x;
    cameraPosition.up.y = camera.up.y;
    cameraPosition.up.z = camera.up.z;

    cameraHolderPosition.rotation.x = cameraHolder.rotation.x;
    cameraHolderPosition.rotation.y = cameraHolder.rotation.y;
    cameraHolderPosition.rotation.z = cameraHolder.rotation.z;

    cameraHolderPosition.position.x = cameraHolder.position.x;
    cameraHolderPosition.position.y = cameraHolder.position.y;
    cameraHolderPosition.position.z = cameraHolder.position.z;

        aviao.position.set(0, 0, 10);

    cameraHolder.position.set(0, 0, 0);
    cameraHolder.rotation.set(0, 0, 0);

    camera.position.set(0, -50, 20);
    camera.rotation.set(0, 0, 0);
    camera.up.set(0, 1, 0);

  } else {
    aviao.position.set(
      planePosition.position.x,
      planePosition.position.y,
      planePosition.position.z
    );
    aviao.rotation.set(
      planePosition.rotation.x,
      planePosition.rotation.y,
      planePosition.rotation.z
    );

    cameraHolder.position.set(
      cameraHolderPosition.position.x,
      cameraHolderPosition.position.y,
      cameraHolderPosition.position.z
    );
    cameraHolder.rotation.set(
      cameraHolderPosition.rotation.x,
      cameraHolderPosition.rotation.y,
      cameraHolderPosition.rotation.z
    );

    camera.position.set(
      cameraPosition.position.x,
      cameraPosition.position.y,
      cameraPosition.position.z
    );
    camera.rotation.set(
      cameraPosition.rotation.x,
      cameraPosition.rotation.y,
      cameraPosition.rotation.z
    );
    camera.up.set(
      cameraPosition.up.x,
      cameraPosition.up.y,
      cameraPosition.up.z
    );
  }
  sim = !sim;
}

const speed = 1.0; /* sets the initial speed */
let mult = 5; /* sets initial speed multiplication */
var movement = false; /* movement check */

var angle = degreesToRadians(0.2); /* rotation angle*/
let angulaSpeedVertical = 1;
let angulaSpeedHorizontal = 1;

async function keyboardUpdate() {
  keyboard.update();

  if (movement == true) updateTime();

  if (keyboard.down('space')) {
    mult = 0;
    mudaCamera();
  }

  if (movement) cameraHolder.translateY(speed * mult);
  else cameraHolder.translateY(0);

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
    cameraHolder.rotateX(-angle * angulaSpeedVertical);
    timer.stop;
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

  if (sim) {
    trackballControls.enabled = true;
    trackballControls.update();
    groundPlane.visible = false
    axesHelper.visible = true
  } else {
    groundPlane.visible = true
    axesHelper.visible = false
  }
}
