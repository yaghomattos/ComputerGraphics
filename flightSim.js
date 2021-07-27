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
import { createCheckpoints } from './track.js';

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
  100,
  50,
  50,
  new THREE.Vector3(0, 1000, 100)
);
scene.add(sum);

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

/**
 * Track
 */
var track = generateTrack();
scene.add(track);

var checkpoints = createCheckpoints();

for(let i = 0; i < checkpoints.length; i++)
{
  var check = checkpoints[i];
  scene.add(check);
}

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, 0, 0);
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

var sim = true;
var cockpit = false;

function changeCamera() {
  if (sim) {
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

    aviao.position.set(0, -2, 5);
    aviao.rotateZ(degreesToRadians(180))

    cameraHolder.position.set(0, 0, 0);
    cameraHolder.rotation.set(0, 0, 0);

    camera.position.set(0, -500, 20);
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
}

function cameraCockpit() {
  if (cockpit) {
    camera.position.set(0, 5, 4);
  } else camera.position.set(0, -30, 10);
}

const speed = 1.0; /* sets the initial speed */
let mult = 5; /* sets initial speed multiplication */
var movement = false; /* movement check */

var angle = degreesToRadians(0.7); /* angle rotation */
let angularSpeedVertical = 2;
let angularSpeedHorizontal = 1;
let animation = degreesToRadians(1);
let modeCam2 = false;

async function keyboardUpdate() {
  keyboard.update();

  if(modeCam2) {
    movement = false;
    animation = 0;
    angularSpeedHorizontal = 0;
    angularSpeedVertical = 0;

    /* invisible secondaryBox */
    speedBox.box.style.display = "none";
    timeBox.box.style.display = "none";
  }
  else {
    angularSpeedVertical = 3;
    angularSpeedHorizontal = 1;
    animation = degreesToRadians(1);

    /* visible secondaryBox */
    speedBox.box.style.display = "block";
    timeBox.box.style.display = "block";
  }

  if (movement) updateTime();

  if (keyboard.down('space')) {
    mult = 0;
    changeCamera();
    sim = !sim;
    modeCam2 = !modeCam2;

    if(!modeCam2)
      mult = 5;

    /* remove all objects */
    sum.visible = !sum.visible;
    track.visible = !track.visible;
    check.visible = !check.visible;
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
    if (aviao.rotation.x > 0 && aviao.rotation.x <= degreesToRadians(21)) {
      aviao.rotation.x -= degreesToRadians(0.5);
    }
    if (aviao.rotation.x < 0 && aviao.rotation.x >= degreesToRadians(-21)) {
      aviao.rotation.x += degreesToRadians(0.5);
    }
  }

  if (keyboard.pressed('left') && aviao.rotation.y <= degreesToRadians(1)) {
    cameraHolder.rotateZ(angle * angularSpeedHorizontal);
    if (aviao.rotation.y >= degreesToRadians(-50)) {
      aviao.rotation.y -= animation;
      angularSpeedHorizontal += 0.1;
    }
  } else if (
    keyboard.pressed('right') &&
    aviao.rotation.y >= degreesToRadians(-1)
  ) {
    cameraHolder.rotateZ(-angle * angularSpeedHorizontal);
    if (aviao.rotation.y <= degreesToRadians(50)) {
      aviao.rotation.y += animation;
      angularSpeedHorizontal += 0.1;
    }
  } else {
    if (aviao.rotation.y > 0 && aviao.rotation.y <= degreesToRadians(51)) {
      aviao.rotation.y -= degreesToRadians(0.5);
      angularSpeedHorizontal = 0.5;
    }
    if (aviao.rotation.y < 0 && aviao.rotation.y >= degreesToRadians(-51)) {
      aviao.rotation.y += degreesToRadians(0.5);
      angularSpeedHorizontal = 0.5;
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
  else renderer.render(scene, camera2);

  /* Ativar trackballs para melhor visualização do mapa todo */
  //trackballControls.update();

  cameraCockpit();

  if (!sim) {
    trackballControls.enabled = true;
    trackballControls.update();
    groundPlane.visible = false;
    axesHelper.visible = true;
  } else {
    groundPlane.visible = true;
    axesHelper.visible = false;
    trackballControls.enabled = false;
  }
}
