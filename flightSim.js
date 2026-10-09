import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import KeyboardState from './lib/KeyboardState.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import {
  initRenderer,
  InfoBox,
  SecondaryBox,
  createGroundPlane,
  onWindowResize,
  degreesToRadians,
  createLightSphere,
} from './lib/util.js';

import { generateTrack, createCheckpoints, CHECKPOINT_RADIUS } from './track.js';
import { FLIGHT, createFlightState, stepFlight } from './flight.js';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

var stats = new Stats(); // To show FPS information
var renderer = initRenderer(); // View function in util/utils

var cameraLoading = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  8000
);
cameraLoading.position.set(0, -75, 0);
cameraLoading.lookAt(0.0, 0.0, 0.0);
cameraLoading.up.set(0.0, 1.0, 0.0);

var loadingScene = new THREE.Scene();
loadingScene.add(new THREE.AmbientLight(0xffffff));

var firstRendering = true;

/* Create main scene */
var scene = new THREE.Scene();

/**
 * Main camera, to airplane view
 */
var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

var listener = new THREE.AudioListener();
  camera.add(listener);
const sound = new THREE.Audio(listener);  
const sound1 = new THREE.Audio(listener);  
const sound2 = new THREE.Audio(listener);  
const sound3 = new THREE.Audio(listener);  

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, -90.0, 10.0);
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 1.0, 0.0);

/**
 * Sencondary camera, to inspection plane
 */
var inspecCamera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

inspecCamera.position.set(0.0, -30.0, 10.0);
inspecCamera.lookAt(0.0, 0.0, 0.0);
inspecCamera.up.set(0.0, 1.0, 0.0);

/**
 * Inspection Scene
 */
var inspecScene = new THREE.Scene();
var aviaoInspec = new THREE.Object3D();
var planeInspec = new THREE.Object3D();
planeInspec.add(aviaoInspec);
planeInspec.position.set(-2, -3, 0);
planeInspec.rotateX(degreesToRadians(90));
planeInspec.rotateY(degreesToRadians(90));
inspecScene.add(planeInspec);

var light2 = new THREE.HemisphereLight(0xffffff, 0x2b2b2b);
inspecScene.add(light2);

var spotLight = new THREE.SpotLight('rgb(255,255,255)');
spotLight.position.copy(new THREE.Vector3(10, 12, 2));
spotLight.intensity = 0.5
spotLight.distance = 0;
spotLight.castShadow = true;
spotLight.decay = 2;
spotLight.penumbra = 0.8;
spotLight.angle = degreesToRadians(60);
planeInspec.add(spotLight);
spotLight.target = planeInspec;

var sphere = createLightSphere(
  inspecScene,
  0.2,
  100,
  100,
  new THREE.Vector3(10, 12, 2)
);
planeInspec.add(sphere);

var trackballControls = new TrackballControls(
  inspecCamera,
  renderer.domElement
);

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer);
    onWindowResize(inspecCamera, renderer);
    onWindowResize(cameraLoading, renderer);
    trackballControls.handleResize();
  },
  false
);

// Sound Effects
var playMusic = false;
var playPlaneSound = false;
var firstMove = true;

var audioLoader = new THREE.AudioLoader();
audioLoader.load( './assets/FlightSimulatorTheme.mp3', function( buffer ) {
	sound.setBuffer(buffer);
	sound.setLoop( true );
	sound.setVolume( 0.5 );
});

audioLoader.load( './assets/planeSound.mp3', function ( buffer ) {
  sound1.setBuffer(buffer);  
	sound1.setLoop( true );
	sound1.setVolume(0.3);
});

audioLoader.load( './assets/checkpoint.mp3', function ( buffer ) {
  sound2.setBuffer(buffer);
	sound2.setVolume(0.7);
});

audioLoader.load( './assets/endgame.mp3', function ( buffer ) {
  sound3.setBuffer(buffer);
	sound3.setVolume(0.6);
});

/**
 * Lights -> HemisphereLight, Directional Light and Dynamic Light
 */

 var light = new THREE.HemisphereLight(0xffffff, 0x2b2b2b, 1);
 scene.add(light);

var dirLight = new THREE.DirectionalLight();
// Same direction as before, pushed far enough to cover the scene with a positive near plane.
dirLight.position.copy(new THREE.Vector3(100, 200, 100).setLength(6000));
dirLight.shadow.bias = 0.0001;
dirLight.shadow.mapSize.width = 4096; // keep within MAX_TEXTURE_SIZE of common GPUs
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.left = -3000;
dirLight.shadow.camera.right = 3000;
dirLight.shadow.camera.top = 3000;
dirLight.shadow.camera.bottom = -3000;
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 12000;
scene.add(dirLight);

var dynamicLight = new THREE.DirectionalLight();
dynamicLight.intensity = 0.8; // No need to iluminate, just used to drop shadow.
dynamicLight.shadow.mapSize.width = 1024;
dynamicLight.shadow.mapSize.height = 1024;
dynamicLight.castShadow = true;
dynamicLight.shadow.camera.left = -100;
dynamicLight.shadow.camera.right = 100;
dynamicLight.shadow.camera.top = 100;
dynamicLight.shadow.camera.bottom = -100;
dynamicLight.shadow.camera.near = 1;
dynamicLight.shadow.camera.far = 1000;
dynamicLight.shadow.camera.updateProjectionMatrix();

/* Offset of the dynamic light from the plane; the light moves with it so its shadow frustum always contains it. */
const dynamicLightOffset = new THREE.Vector3(-10, -20, 30).setLength(300);

function lightFollowTarget() {
  dynamicLight.position.copy(cameraHolder.position).add(dynamicLightOffset);
  dynamicLight.target.position.copy(cameraHolder.position);
  dynamicLight.target.updateMatrixWorld();
}

/**
 * Plane 9x
 */
var groundPlane = createGroundPlane(40500, 40500, 1, 1, 'rgb(130,130,130)')
groundPlane.receiveShadow = false;
scene.add(groundPlane);

const GROUND_SURFACE = 5; /* height of the city ground, where the airplane rolls */

var cityPlane = createGroundPlane(4500, 4500, 1, 1, 'rgb(200,100,100)')
cityPlane.translateZ(GROUND_SURFACE);
cityPlane.translateX(200);
cityPlane.translateY(-700);
scene.add(cityPlane);

/**
 * Loading resources: both models share one manager, which drives the loading bar.
 */
var loadingProgress = 0; /* 0..1 */
var resourcesLoaded = false;

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  // itemsTotal grows while materials discover their textures, so never move the bar backwards.
  loadingProgress = Math.max(loadingProgress, itemsLoaded / itemsTotal);
};
loadingManager.onLoad = function () {
  loadingProgress = 1;
  resourcesLoaded = true;
};
loadingManager.onError = function (url) {
  console.warn('There was an error loading ' + url);
};

/**
 * airplane
 */
var aviao = new THREE.Object3D();
aviao.position.set(0, -0.5, 2);
loadOBJFile('./assets/14 bis/', '14 bis');

/**
 * Track
 */
var track = generateTrack();
scene.add(track);

var checkpoints = createCheckpoints();
checkpoints.forEach((ring) => scene.add(ring));

/**
 * City
*/
loadOBJFile('./assets/cenario att 3/', 'cidade');

/**
 * Object to controll camera
 */
var cameraHolder = new THREE.Object3D();
const startPosition = new THREE.Vector3(1458, 10, 5);
const startHeading = degreesToRadians(-328);
cameraHolder.position.copy(startPosition);
cameraHolder.rotateZ(startHeading);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

/**
 * Information boxes
*/
var speedBox = new SecondaryBox('');

var timeBox = new SecondaryBox(' Time: 0.00');
timeBox.box.style.bottom = '50px';

var checkBox = new SecondaryBox('');
checkBox.box.style.bottom = '100px';

var initialMessage = new SecondaryBox('loading 0%...');
initialMessage.box.style.backgroundColor = 'rgba(0,0,0)';
initialMessage.box.style.left = '27%';
initialMessage.box.style.bottom = '35%';

var keyboard = new KeyboardState();

/* timer, started when the first checkpoint is crossed */
var timer = new THREE.Clock(false);
var elapsedTime = 0;

function updateTime() {
  elapsedTime += timer.getDelta();
  timeBox.changeMessage(' Time: ' + elapsedTime.toFixed(2));
}

function setHudVisible(visible) {
  const display = visible ? 'block' : 'none';
  speedBox.box.style.display = display;
  timeBox.box.style.display = display;
  checkBox.box.style.display = display;
}

setHudVisible(false); // shown when the flight starts

/* message speed */
/* The scene is not to scale, so the HUD shows speeds in a "game" km/h. */
const SPEED_TO_KMH = 0.3;
const toKmh = (speed) => Math.round(speed * SPEED_TO_KMH);

function updateSpeed() {
  const throttle = flight.throttle === 1 ? 'MAX' : Math.round(flight.throttle * 100) + '%';
  let message = 'Speed: ' + toKmh(flight.speed) + ' km/h · Throttle: ' + throttle;
  if (flight.onGround && flight.speed < FLIGHT.STALL_SPEED) {
    message += ' (takeoff at ' + toKmh(FLIGHT.STALL_SPEED) + ' km/h)';
  }
  speedBox.changeMessage(message);
}

/**
 * Checkpoints: they must be crossed in order, through the ring.
 */
var nextCheckpoint = 0;
var previousSide = null; // side of the next ring's plane the airplane was on in the last frame
const airplaneLocal = new THREE.Vector3();

function updateCheckpointBox() {
  checkBox.changeMessage(
    'Checkpoint(s): ' + nextCheckpoint + '/' + checkpoints.length
  );
}

function highlightNextCheckpoint() {
  checkpoints.forEach((ring, i) => {
    ring.material.opacity = i === nextCheckpoint ? 0.9 : 0.3;
  });
}

function updateCheckpoints() {
  if (finished) return;

  const ring = checkpoints[nextCheckpoint];
  airplaneLocal.copy(cameraHolder.position);
  ring.worldToLocal(airplaneLocal);

  // The ring lies on its local XY plane: crossing it means local Z changed sign inside the radius.
  const side = Math.sign(airplaneLocal.z);
  const insideRing = Math.hypot(airplaneLocal.x, airplaneLocal.y) < CHECKPOINT_RADIUS;

  if (previousSide !== null && side !== previousSide && insideRing) passCheckpoint(ring);
  else previousSide = side;
}

function passCheckpoint(ring) {
  ring.visible = false;
  previousSide = null;

  if (nextCheckpoint === 0) {
    started = true;
    timer.start();
  }
  nextCheckpoint++;
  updateCheckpointBox();

  if (nextCheckpoint === checkpoints.length) {
    updateTime();
    timer.stop();
    finished = true;
    sound3.play();
  } else {
    sound2.play();
    highlightNextCheckpoint();
  }
}

updateCheckpointBox();
highlightNextCheckpoint();

/**
 * Skybox
 */
function createSkybox() {  
  const textureLoader = new THREE.TextureLoader();
  const materialArray = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'].map(
    (face) =>
      new THREE.MeshBasicMaterial({
        map: textureLoader.load('./assets/skybox/arid2_' + face + '.jpg'),
        side: THREE.BackSide,
      })
  );

  let skyboxGeo = new THREE.BoxGeometry(40500, 40500, 40500);
  let skybox = new THREE.Mesh( skyboxGeo, materialArray );
  skybox.rotation.x = Math.PI/2
  skybox.translateX(-3000)
  skybox.rotation.y = Math.PI/2
  scene.add( skybox );  
  skybox.castShadow = false;
  skybox.receiveShadow = false;
}

createSkybox();

/**
 * Control cockpit camera
*/
var sim = true;
var cockpit = false;

function cameraCockpit() {
  if (cockpit) {
    camera.position.set(0, -0.8, 3);
  } else camera.position.set(0, -30, 10);
}

/**
 * Flight: the physics lives in flight.js; here the keys are read and the result is shown.
 */
var flight = createFlightState({
  x: startPosition.x,
  y: startPosition.y,
  z: startPosition.z,
  heading: startHeading,
});

function flightInput() {
  const axis = (positive, negative) => (keyboard.pressed(positive) ? 1 : 0) - (keyboard.pressed(negative) ? 1 : 0);
  return {
    throttle: axis('Q', 'A'),
    pitch: axis('down', 'up'), // stick convention: pulling back (down arrow) raises the nose
    roll: axis('right', 'left'),
  };
}

/* Height of the ground (or of whatever is below) at a point of the scene. */
function groundHeightAt(x, y) {
  return GROUND_SURFACE;
}

function updateFlight(dt) {
  stepFlight(flight, flightInput(), dt, groundHeightAt);
  keepClearOfGround();

  cameraHolder.position.set(flight.x, flight.y, flight.z);
  cameraHolder.rotation.set(0, 0, flight.heading);
  aviao.rotation.set(flight.pitch, flight.bank, 0);

  if (flight.throttle > 0) playPlaneSound = true;
  updateSpeed();
}

var modeCam2 = false;
var started = false;

var finished = false;

/**
 * Ground clearance: pitch and bank are limited so no part of the airplane goes below the ground
 * (e.g. a wingtip while turning at low altitude). The lowest point of the model, for any attitude,
 * is one of the vertices of its convex hull, computed once when the model loads.
 */
var hullPoints = []; /* convex hull vertices, in aviao's local space */
const attitude = new THREE.Euler();
const attitudeQuaternion = new THREE.Quaternion();
const hullPoint = new THREE.Vector3();

function computeHullPoints(model) {
  aviao.updateMatrixWorld(true);
  const worldToAviao = aviao.matrixWorld.clone().invert();
  const meshToAviao = new THREE.Matrix4();
  const points = [];
  model.traverse(function (child) {
    if (!child.isMesh) return;
    meshToAviao.multiplyMatrices(worldToAviao, child.matrixWorld);
    const position = child.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(meshToAviao));
    }
  });
  // ConvexHull.vertices keeps every input point; the hull itself is given by the faces.
  const hull = new ConvexHull().setFromPoints(points);
  const hullVertices = new Set();
  for (const face of hull.faces) {
    let edge = face.edge;
    do {
      hullVertices.add(edge.head().point);
      edge = edge.next;
    } while (edge !== face.edge);
  }
  hullPoints = [...hullVertices];
}

/* Height of the lowest point of the airplane above the ground, for the given pitch and bank. */
function groundClearance(pitch, bank) {
  attitudeQuaternion.setFromEuler(attitude.set(pitch, bank, aviao.rotation.z));
  let lowest = Infinity;
  for (const point of hullPoints) {
    lowest = Math.min(lowest, hullPoint.copy(point).applyQuaternion(attitudeQuaternion).z);
  }
  // cameraHolder only rotates around Z, so local heights are world heights.
  return flight.z + aviao.position.z + lowest - groundHeightAt(flight.x, flight.y);
}

/* Levels the wings and the nose just enough to keep the airplane clear of the ground. */
function keepClearOfGround() {
  const pitch = flight.pitch;
  const bank = flight.bank;
  if (groundClearance(pitch, bank) >= 0) return;

  // Binary search for the largest fraction of the current attitude that still clears the ground.
  let safe = 0;
  let unsafe = 1;
  for (let i = 0; i < 10; i++) {
    const fraction = (safe + unsafe) / 2;
    if (groundClearance(pitch * fraction, bank * fraction) >= 0) safe = fraction;
    else unsafe = fraction;
  }
  flight.pitch = pitch * safe;
  flight.bank = bank * safe;
}

function restartRace() {
  flight = createFlightState({
    x: startPosition.x,
    y: startPosition.y,
    z: startPosition.z,
    heading: startHeading,
  });
  updateFlight(0);

  checkpoints.forEach((ring) => (ring.visible = true));
  nextCheckpoint = 0;
  previousSide = null;
  updateCheckpointBox();
  highlightNextCheckpoint();

  timer.stop();
  elapsedTime = 0;
  started = false;
  finished = false;
  timeBox.changeMessage(' Time: 0.00');
}

updateSpeed();

function keyboardUpdate(dt) {
  keyboard.update();

  // Flight and camera input only applies once the game has started.
  if (!initialize) return;

  if(playMusic)  
  {
    sound.play();
    playMusic = false;
  }   

  if(playPlaneSound && firstMove)     
  {
    sound1.play();
    firstMove = false;
  } 

  /* the HUD is hidden while inspecting the airplane */
  setHudVisible(!modeCam2);
  if (modeCam2) controls.infoBox.style.display = 'none';

  updateCheckpoints();
  if (started && !finished) updateTime();

  if (keyboard.down('H')) {
    if (controls.infoBox.style.display === 'none')
      controls.infoBox.style.display = 'block';
    else controls.infoBox.style.display = 'none';
  }

  if (keyboard.down('space')) {
    sim = !sim;
    modeCam2 = !modeCam2;
  }

  if (keyboard.down('enter')) {
    track.visible = !track.visible;
  }

  if (keyboard.down('C')) {
    cockpit = !cockpit;
  }

  if (keyboard.down('R')) {
    restartRace();
  }

  // The airplane is paused while it is being inspected; speed is kept for when the flight resumes.
  if (modeCam2) return;

  updateFlight(dt);
}

/**
 * Message to controls
 */
var controls = new InfoBox();
controls.add('Controls');
controls.addParagraph();
controls.add('Space to change camera mode');
controls.add('C for cockpit camera');
controls.add('Q / A: throttle up / down');
controls.add('Down / Up arrow: nose up / down');
controls.add('Left / Right arrow: bank and turn');
controls.add('Enter to show/hide track');
controls.add('R to restart the race');
controls.add('H to show/hide this help');
controls.show();
controls.infoBox.style.display = 'none';

const LOADING_SEGMENTS = 4;
const loadingSegments = [];
for (let i = 0; i < LOADING_SEGMENTS; i++) {
  const segment = new SecondaryBox('');
  Object.assign(segment.box.style, {
    backgroundColor: 'rgba(200,200,0)',
    width: '5%',
    height: '5%',
    left: 38 + i * 6 + '%',
    bottom: '46%',
    display: 'none',
  });
  loadingSegments.push(segment);
}

const texture = new THREE.TextureLoader().load( "./assets/background.jpg" );
var material = new THREE.MeshBasicMaterial({ map: texture })
let backgroundGeo = new THREE.BoxGeometry(window.innerWidth/12, window.innerHeight/12 , -5);
let background = new THREE.Mesh( backgroundGeo, material );
loadingScene.add(background) 
background.rotateX(degreesToRadians(90))

var initialize = false;

function checkInit() {
  if (resourcesLoaded && keyboard.down('enter')) {
    initialize = true;
    playMusic = true;
  }
}

/**
 * Loads an OBJ model with its MTL materials and places it in the scene.
 */
function loadOBJFile(modelPath, modelName) {
  var mtlLoader = new MTLLoader(loadingManager);
  mtlLoader.setPath(modelPath);
  mtlLoader.load(modelName + '.mtl', function (materials) {
    materials.preload();

    var objLoader = new OBJLoader(loadingManager);
    objLoader.setMaterials(materials);
    objLoader.setPath(modelPath);
    objLoader.load(modelName + '.obj', function (obj) {
      obj.name = modelName;
      obj.traverse(function (child) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) child.material.side = THREE.DoubleSide;
      });

      if (modelName == 'cidade') {
        obj.rotateX(degreesToRadians(90));
        obj.translateZ(1000);
        obj.translateX(-200);
        obj.translateY(5);
        scene.add(obj);
      }

      if (modelName == '14 bis') {
        aviao.add(obj);
        aviaoInspec.copy(aviao, true);
        obj.rotateX(Math.PI / 2);
        obj.rotateY(Math.PI / 2);
        computeHullPoints(obj);
      }
    });
  });
}

function loading() {
  renderer.render(loadingScene, cameraLoading);

  initialMessage.changeMessage(
    resourcesLoaded
      ? 'Loading 100%... Arquivos carregados! Pressione Enter para iniciar'
      : 'Loading ' + Math.floor(loadingProgress * 100) + '%...'
  );
  loadingSegments.forEach((segment, i) => {
    segment.box.style.display = loadingProgress >= (i + 1) / LOADING_SEGMENTS ? 'block' : 'none';
  });
}

/* Switches from the loading screen to the flight, once. */
function startFlight() {
  initialMessage.box.style.display = 'none';
  loadingSegments.forEach((segment) => (segment.box.style.display = 'none'));
  renderer.setClearColor('rgb(135, 206, 235)');
  controls.infoBox.style.display = 'block';
  setHudVisible(true);
  scene.add(dynamicLight);
}

const frameClock = new THREE.Clock();

function render() {
  stats.update(); // Update FPS
  keyboardUpdate(frameClock.getDelta());
  requestAnimationFrame(render); // Show events
  if (initialize != true) {
    loading();
    checkInit();
  } else {
    if (firstRendering) {
      startFlight();
      firstRendering = false;
    }
    lightFollowTarget();
    if (sim) renderer.render(scene, camera);
    else renderer.render(inspecScene, inspecCamera);
  }
  cameraCockpit();
  trackballControls.update();
}

render();
