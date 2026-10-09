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

import { generateTrack, createCheckpoints, getRadius } from './track.js';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

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

var cityPlane = createGroundPlane(4500, 4500, 1, 1, 'rgb(200,100,100)')
cityPlane.translateZ(5);
cityPlane.translateX(200);
cityPlane.translateY(-700);
scene.add(cityPlane);

// var cityPlane = new THREE.Object3D();
// loadOBJFile('./assets/plano base/', 'plano', 2, 0, true, cityPlane);

/**
 * airplane
 */
var aviao = new THREE.Object3D();
aviao.position.set(0, -0.5, 2);
loadOBJFile('./assets/14 bis/', '14 bis', 2, 0, true, aviao);

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
 * City
*/
var cidade = new THREE.Object3D();
loadOBJFile('./assets/cenario att 3/', 'cidade', 2, 0, true, cidade);

/**
 * Object to controll camera
 */
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(1458, 10, 5);
cameraHolder.rotateZ(degreesToRadians(-328))
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

/**
 * Information boxes
*/
var speedBox = new SecondaryBox('');

var maxSpeedBox = new SecondaryBox('');
maxSpeedBox.box.style.left = '225px';
maxSpeedBox.box.style.display = 'none';

var timeBox = new SecondaryBox('');
timeBox.box.style.bottom = '50px';

var checkBox = new SecondaryBox('');
checkBox.box.style.bottom = '100px';

var initialMessage = new SecondaryBox('loading 0%...');
initialMessage.box.style.backgroundColor = 'rgba(0,0,0)';
initialMessage.box.style.left = '27%';
initialMessage.box.style.bottom = '35%';

var keyboard = new KeyboardState();

/* timer */
var timer = new THREE.Clock();
var delta = 0;

function updateTime() {
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

/**
 * Checkpoints update
 */
var checkpointsCount = 0;

function updateCheckedpoint(checkPointIndex) {
  checkBox.changeMessage(
    'Checkpoint(s): ' + checkpointsCount + '/' + checkpoints.length
  );
  if(checkPointIndex != 12)
    sound2.play();
}

/**
 * Skybox
 */
function createSkybox() {  
  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load('./assets/skybox/arid2_ft.jpg');
  let texture_bk = new THREE.TextureLoader().load('./assets/skybox/arid2_bk.jpg');
  let texture_up = new THREE.TextureLoader().load('./assets/skybox/arid2_up.jpg');
  let texture_dn = new THREE.TextureLoader().load('./assets/skybox/arid2_dn.jpg');
  let texture_rt = new THREE.TextureLoader().load('./assets/skybox/arid2_rt.jpg');
  let texture_lf = new THREE.TextureLoader().load('./assets/skybox/arid2_lf.jpg');
    
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

  for (let i = 0; i < 6; i++)
     materialArray[i].side = THREE.BackSide;
     
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

/* Variables to control */
const speed = 1.0; /* sets the initial speed */
var mult = 2; /* sets initial speed multiplication */
var movement = false; /* movement check */
var angularSpeedVertical = 0.317;
var angularSpeedHorizontal = 0.00238;

/*  */
var animation = degreesToRadians(0.1587);
var modeCam2 = false;
var started = false;

var latest = false;

function keyboardUpdate() {
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

  if (modeCam2) {
    movement = false;
    /* invisible secondaryBox */
    speedBox.box.style.display = 'none';
    timeBox.box.style.display = 'none';
    maxSpeedBox.box.style.display = 'none';
    checkBox.box.style.display = 'none';
    controls.infoBox.style.display = 'none';
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
          updateCheckedpoint(i);
        }
        checkpoints[i].visible = false;
      } else {
        if (checkpoints[i].visible == true) {
          checkpointsCount++;
          updateCheckedpoint(i);
        }
        checkpoints[i].visible = false;
      }
    }
    if (!checkpoints[12].visible && !latest) {
      updateTime(stop);
      sound3.play();
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

  if (keyboard.pressed('Q') && mult < 6.4) {
    mult += 0.1;
    updateSpeed();   
    movement = true;
    playPlaneSound = true;
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

/**
 * Message to controls
 */
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

var loadingSegment1 = new SecondaryBox('');
loadingSegment1.box.style.backgroundColor = 'rgba(200,200,0)';
loadingSegment1.box.style.width = '5%'
loadingSegment1.box.style.height = '5%'
loadingSegment1.box.style.left = '38%';
loadingSegment1.box.style.bottom = '46%';
loadingSegment1.box.style.display = 'none';

var loadingSegment2 = new SecondaryBox(''); 
loadingSegment2.box.style.backgroundColor = 'rgba(200,200,0)';
loadingSegment2.box.style.width = '5%'
loadingSegment2.box.style.height = '5%'
loadingSegment2.box.style.left = '44%';
loadingSegment2.box.style.bottom = '46%';
loadingSegment2.box.style.display = 'none';


var loadingSegment3 = new SecondaryBox('');
loadingSegment3.box.style.backgroundColor = 'rgba(200,200,0)';
loadingSegment3.box.style.width = '5%'
loadingSegment3.box.style.height = '5%'
loadingSegment3.box.style.left = '50%';
loadingSegment3.box.style.bottom = '46%';
loadingSegment3.box.style.display = 'none';


var loadingSegment4 = new SecondaryBox('');
loadingSegment4.box.style.backgroundColor = 'rgba(200,200,0)';
loadingSegment4.box.style.width = '5%'
loadingSegment4.box.style.height = '5%'
loadingSegment4.box.style.left = '56%';
loadingSegment4.box.style.bottom = '46%';
loadingSegment4.box.style.display = 'none';

var count = 0;

const texture = new THREE.TextureLoader().load( "./assets/background.jpg" );
var material = new THREE.MeshBasicMaterial({ map: texture })
let backgroundGeo = new THREE.BoxGeometry(window.innerWidth/12, window.innerHeight/12 , -5);
let background = new THREE.Mesh( backgroundGeo, material );
loadingScene.add(background) 
background.rotateX(degreesToRadians(90))

var initialize = false;
var resourcesLoaded = false;

function checkInit() {
  if (resourcesLoaded && keyboard.down('enter')) {
    initialize = true;
    playMusic = true;
  }
}

/**
 * Loading resources
 */
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
    if (count === 1) {
      initialMessage.changeMessage('Loading 50%...');
      loadingSegment2.box.style.display = 'block';
      count++;
    }
    if (count === 2) {
      initialMessage.changeMessage('Loading 75%...');
      loadingSegment3.box.style.display = 'block';
      count++;
    }
    console.log('Loading complete!');
    count ++;
    if (count === 5) {
      loadingSegment4.box.style.display = 'block';
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

      if (modelName == 'cidade') {
        // console.log('começando a adicionar');
        obj.rotateX(degreesToRadians(90));
        // obj.rotateY((-Math.PI * 2) / 3 + Math.PI / 2 - Math.PI / 6);
        obj.translateZ(1000);
        obj.translateX(-200);
        obj.translateY(5);
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

      if(modelName == 'plano') {
        obj.rotateX(Math.PI / 2);
        scene.add(obj)
      }
    });
  });
}

function loading() {
  renderer.render(loadingScene, cameraLoading);
  renderer.setClearColor('rgb(80, 80, 80)');

  initialMessage.box.style.display = 'block';

  if (count === 0) {
    initialMessage.changeMessage('Loading 25%...');
    loadingSegment1.box.style.display = 'block';
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
  lightFollowTarget();
  loadingSegment1.box.style.display = 'none';
  loadingSegment2.box.style.display = 'none';
  loadingSegment3.box.style.display = 'none';
  loadingSegment4.box.style.display = 'none';
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
      //dirLight.shadow.autoUpdate = false;
      scene.add(dynamicLight);
      firstRendering = false;
    }
    flightSim();
    if (sim) renderer.render(scene, camera);
    else renderer.render(inspecScene, inspecCamera);
  }
  cameraCockpit();
  trackballControls.update();
}

render();
