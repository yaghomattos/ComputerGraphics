import * as THREE from '../build/three.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import {
  initRenderer,
  InfoBox,
  SecondaryBox,
  createGroundPlane,
  onWindowResize,
  degreesToRadians,
  createLightSphere,
  initDefaultBasicLight,
} from '../libs/util/util.js';

import { generateTrack, createCheckpoints, getRadius } from './track.js';

import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';

var stats = new Stats(); // To show FPS information
var renderer = initRenderer(); // View function in util/utils

var cameraLoading = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  80
);
cameraLoading.position.set(0.0, -15.0, 20.0);
cameraLoading.lookAt(0.0, 0.0, 0.0);
cameraLoading.up.set(0.0, 1.0, 0.0);

var loadingScene = new THREE.Scene();
loadingScene.add(new THREE.AmbientLight(0xffffff));

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
initDefaultBasicLight(inspecScene);
var aviaoInspec = new THREE.Object3D();
var planeInspec = new THREE.Object3D();
planeInspec.add(aviaoInspec);
planeInspec.position.set(0, 0, 0);
inspecScene.add(planeInspec);

var trackballControls = new TrackballControls(
  inspecCamera,
  renderer.domElement
);

// Listen window size changes
window.addEventListener(
  'resize',
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

/**
 * Lights -> HemisphereLight, Directional Light and LightSphere (Sum)
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
dirLight.position.copy(new THREE.Vector3(100, 200, 100));
dirLight.shadow.bias = 0.0001;
dirLight.shadow.mapSize.width = 1024 * 20;
dirLight.shadow.mapSize.height = 1024 * 20;
dirLight.shadow.camera.left = -1550;
dirLight.shadow.camera.right = 1550;
dirLight.shadow.camera.top = 1550;
dirLight.shadow.camera.bottom = -1550;
dirLight.castShadow = true;
dirLight.shadow.camera.near = -5000; // default
dirLight.shadow.camera.far = 5000; // default

scene.add(dirLight);

var light = new THREE.HemisphereLight(0xffffff, 0x2b2b2b);
scene.add(light);

/**
 * wireframe plan
 */
var groundPlane = createGroundPlane(
  10000,
  10000,
  1,
  1,
  'rgb(34,139,34)'
);
groundPlane.rotateX(degreesToRadians(0));
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
// track.castShadow = true;
// track.receiveShadow = true;
scene.add(track);



var checkpoints = createCheckpoints();

for (let i = 0; i < checkpoints.length; i++) {
  var check = checkpoints[i];
  // check.castShadow = true;
  // check.receiveShadow = true;
  scene.add(check);
}

/**
 * cenario
 */
var cenario = new THREE.Object3D();
loadOBJFile('./assets/', 'cenario', 2, 0, true, cenario);

/**
 * simple object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0, -1000, 0);
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

var speedBox = new SecondaryBox('');

var maxSpeedBox = new SecondaryBox('');
maxSpeedBox.box.style.left = '225px';
maxSpeedBox.box.style.display = 'none';

var timeBox = new SecondaryBox('');
timeBox.box.style.bottom = '50px';

var checkBox = new SecondaryBox('');
checkBox.box.style.bottom = '100px';

var initialMessage = new SecondaryBox('loading 0%...');
initialMessage.box.style.backgroundColor = 'rgba(0,0,0,0)';
initialMessage.box.style.left = '27%';
initialMessage.box.style.bottom = '30%';

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

var checkpointsCount = 0;

function updateCheckedpoint() {
  checkBox.changeMessage(
    'Checkpoint(s): ' + checkpointsCount + '/' + checkpoints.length
  );
}

function createSkybox() {  
  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_ft.jpg');
  let texture_bk = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_bk.jpg');
  let texture_up = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_up.jpg');
  let texture_dn = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_dn.jpg');
  let texture_rt = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_rt.jpg');
  let texture_lf = new THREE.TextureLoader().load('../flightSim/assets/skybox/arid2_lf.jpg');
    
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

  for (let i = 0; i < 6; i++)
     materialArray[i].side = THREE.BackSide;
     
  let skyboxGeo = new THREE.BoxGeometry(20000, 15000, 15000);
  let skybox = new THREE.Mesh( skyboxGeo, materialArray );
  skybox.rotation.x = Math.PI/2
  skybox.translateX(-3000)
  skybox.rotation.y = Math.PI/2
  scene.add( skybox );  
}

function createSkyboxAlt() {  
  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_ft.jpg');
  let texture_bk = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_bk.jpg');
  let texture_up = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_up.jpg');
  let texture_dn = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_dn.jpg');
  let texture_rt = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_rt.jpg');
  let texture_lf = new THREE.TextureLoader().load('../flightSim/assets/skybox_alt/bluecloud_lf.jpg');
    
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

  for (let i = 0; i < 6; i++)
     materialArray[i].side = THREE.BackSide;
     
  let skyboxGeo = new THREE.BoxGeometry(20000, 15000, 15000);
  let skybox = new THREE.Mesh( skyboxGeo, materialArray );
  skybox.rotation.x = Math.PI/2
  skybox.rotation.y = Math.PI/2
  scene.add( skybox );  
}

createSkybox();

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

  if (keyboard.down('H')) {
    if (controls.infoBox.style.display === 'none')
      controls.infoBox.style.display = 'block';
    else controls.infoBox.style.display = 'none';
  }

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
controls.infoBox.style.display = 'none';

var firstRendering = true;

function createSlider(a, b, c) {
  var sliderGeometry = new THREE.BoxGeometry(5, 3.5, 0.5);
  var sliderMaterial = new THREE.MeshPhongMaterial({
    color: 'rgb(100,250,200)',
  });
  var slider = new THREE.Mesh(sliderGeometry, sliderMaterial);
  slider.position.set(a, b, c);
  return slider;
}

var count = 0;

var borderMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(0,0,0)' });
var borderGeometry = new THREE.BoxGeometry(20, 0.5, 0.3);
var bottomBorder = new THREE.Mesh(borderGeometry, borderMaterial);
bottomBorder.position.set(0.0, 0.0, 0.0);
loadingScene.add(bottomBorder);

var topBorder = new THREE.Mesh(borderGeometry, borderMaterial);
topBorder.position.set(0.0, 4.0, 0.0);
loadingScene.add(topBorder);

var borderGeometry2 = new THREE.BoxGeometry(0.5, 4.5, 0.3);
var rightBorder = new THREE.Mesh(borderGeometry2, borderMaterial);
rightBorder.position.set(10, 2.0, 0.0);
loadingScene.add(rightBorder);

var leftBorder = new THREE.Mesh(borderGeometry2, borderMaterial);
leftBorder.position.set(-10, 2.0, 0.0);
loadingScene.add(leftBorder);

var initialize = false;
var resourcesLoaded = false;

function checkInit() {
  if (resourcesLoaded && keyboard.down('enter')) {
    initialize = true;
  }
}

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
    if (count === 2) {
      initialMessage.changeMessage('Loading 75%...');
      loadingScene.add(createSlider(2.5, 2.0, 0.0));
      count++;
    }
    console.log('Loading complete!');
    if (count === 3) {
      loadingScene.add(createSlider(7.2, 2.0, 0.0));
      initialMessage.changeMessage(
        'Loading 100%... Arquivos carregados! Pressione Enter para iniciar'
      );
      resourcesLoaded = true;
    }
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
      obj.traverse(function (child) {
        // console.log('carregando...');
        child.castShadow = true;
        child.receiveShadow = true;
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
  renderer.render(loadingScene, cameraLoading);
  renderer.setClearColor('rgb(80, 80, 80)');

  initialMessage.box.style.display = 'block';

  if (count < 1) {
    loadingScene.add(createSlider(-7.2, 2.0, 0.0));
    count++;
  }

  if (count === 1) {
    initialMessage.changeMessage('Loading 50%...');
    loadingScene.add(createSlider(-2.5, 2.0, 0.0));
    count++;
  }

  speedBox.box.style.display = 'none';
  timeBox.box.style.display = 'none';
  maxSpeedBox.box.style.display = 'none';
  checkBox.box.style.display = 'none';
}

function flightSim() {
  initialMessage.box.style.display = 'none';
  renderer.setClearColor('rgb(135, 206, 235)');
}

function render() {
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  if (initialize != true) {
    loading();
    checkInit();
  } else {
    if (firstRendering) {
      controls.infoBox.style.display = 'block';
      firstRendering = false;
    }
    flightSim();
    if (sim) renderer.render(scene, camera);
    else renderer.render(inspecScene, inspecCamera);
  }
  cameraCockpit();
  trackballControls.update();
}
