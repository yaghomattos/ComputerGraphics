import * as THREE from  '../build/three.module.js';
import Stats from  '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        InfoBox,
        createGroundPlaneWired,
        initDefaultBasicLight,
        onWindowResize, 
        degreesToRadians} from '../libs/util/util.js';

import { gerarAviao } from './airplane.js';


var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 40)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, -50.0, 15.0);
camera.up.set(0.0, 1.0, 0.0);

var trackballControls = new TrackballControls( camera, renderer.domElement );

/**
 * simple light 
 */
initDefaultBasicLight(scene);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

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
 * Airplane
 */
var aviao = gerarAviao();
//aviao.rotateY(degreesToRadians(180));
//aviao.rotateZ(degreesToRadians(180));
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
//cameraHolder.rotateX(degreesToRadians(20));
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

render();

const speed = 1.0; /* sets the initial speed */
let mult = 0.8; /* sets initial speed multiplication */
var verification = false; /* movement check */
let angleHelperX = 0;
let angleHelperY = 0;
let angularSpeed = Math.PI*0.005;

var angle = degreesToRadians(0.8); 

async function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.down("enter") ) {
    verification = !verification;
  }
  
  if ( keyboard.down("space") ) {
      groundPlane.visible = !groundPlane.visible;
      axesHelper.visible = !axesHelper.visible;
  }

  if(verification) cameraHolder.translateY(speed * mult);

  if ( keyboard.pressed("Q") && mult <= 8)  {
    mult += 0.05;
  }
  if ( keyboard.pressed("A") && mult > 0.5)  { 
    mult -= 0.05; 
  }


  /*
  if (keyboard.pressed('up')) cameraHolder.rotateX(angle);
  if (keyboard.down('up')) aviao.rotateX(degreesToRadians(45));
  if (keyboard.up('up')) aviao.rotateX(degreesToRadians(-45));
  

  if (keyboard.pressed('down')) cameraHolder.rotateX(-angle); 
  if (keyboard.down('down')) aviao.rotateX(degreesToRadians(-45));
  if (keyboard.up('down')) aviao.rotateX(degreesToRadians(45));
  */
  
  if (keyboard.pressed('down') && angleHelperX <= Math.PI/4 ) {
    cameraHolder.rotateX(angularSpeed);
    angleHelperX += angularSpeed;
    }
  else if (keyboard.pressed('up') && angleHelperX >= -Math.PI/4 ) {
      cameraHolder.rotateX(-angularSpeed);
      angleHelperX -= angularSpeed;
    }

  /*
  if (keyboard.pressed('left')) cameraHolder.rotateZ(angle);
  if (keyboard.down('left')) aviao.rotateZ(degreesToRadians(45));
  if (keyboard.up('left')) aviao.rotateZ(degreesToRadians(-45));

  if (keyboard.pressed('right')) cameraHolder.rotateZ(-angle);
  if (keyboard.down('right')) aviao.rotateZ(degreesToRadians(-45));
  if (keyboard.up('right')) aviao.rotateZ(degreesToRadians(45));
  */

  if (keyboard.pressed('left')) {
    cameraHolder.rotateZ(angle);
    cameraHolder.rotateZ(angle);
    
    if (angleHelperY >= degreesToRadians(-30)) {
      aviao.rotateY(-4*angularSpeed);
      angleHelperY -= 4*angularSpeed;
    }
  }
  else if (keyboard.pressed('right')) {
    cameraHolder.rotateZ(-angle);
    cameraHolder.rotateZ(-angle);
    
    if (angleHelperY <= degreesToRadians(30)) {
      aviao.rotateY(4*angularSpeed);
      angleHelperY += 4*angularSpeed;
      }
    }
  else {
    if (angleHelperY > 0) {
      aviao.rotateY(-4*angularSpeed);
      angleHelperY -= 4*angularSpeed;
    }
    if (angleHelperY < 0) {
      aviao.rotateY(4*angularSpeed);
      angleHelperY += 4*angularSpeed;
    }
  }

  if (keyboard.pressed(',')) cameraHolder.rotateY(-angle);
  if (keyboard.down(',')) aviao.rotateY(degreesToRadians(-45));
  if (keyboard.up(',')) aviao.rotateY(degreesToRadians(45));
  if (keyboard.pressed('.')) cameraHolder.rotateY(angle);
  if (keyboard.down('.')) aviao.rotateY(degreesToRadians(45));
  if (keyboard.up('.')) aviao.rotateY(degreesToRadians(-45));
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
  controls.add('Controls');
  controls.addParagraph();
    controls.add("Enter to start moving")
    controls.add("Space to change camera mode")
    controls.add("Q to speed up");
    controls.add("A to speed down");
    controls.add("Up/Down arrow to elevator");
    controls.add("Left / Right arrow to rudder");
    controls.add(", or < / . or > to aileron")
    controls.show();
}

function render()
{
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  if (groundPlane.visible) {
    trackballControls.enabled = false;

  } else {
    trackballControls.enabled = true;
    trackballControls.update();
  }
  renderer.render(scene, camera); // Render scene
}
