import * as THREE from  '../../build/three.module.js';
import Stats from  '../../build/jsm/libs/stats.module.js';
import KeyboardState from '../../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        createGroundPlaneWired,
        initDefaultBasicLight,
        onWindowResize, 
        degreesToRadians} from "../../libs/util/util.js";

import { gerarAviao } from './airplane.js';


var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 40)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, 30.0, 0.0); 
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 1.0, 0.0);
camera.rotateX(degreesToRadians(-10));

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
aviao.rotateY(degreesToRadians(180));
aviao.rotateZ(degreesToRadians(180));
aviao.translateZ(-5);
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
cameraHolder.position.set(0, 0, 10)
cameraHolder.rotateY(degreesToRadians(180));
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(aviao);

render();

const speed = 1.0; /* sets the initial speed */
let cont = 0.8; /* sets initial speed multiplication */
let verify = false; /* movement check */

var angle = degreesToRadians(0.8); 

async function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.pressed("enter") ) {
    verify = !verify;
  }
  
  if ( keyboard.pressed("space") ) {
      groundPlane.visible = !groundPlane.visible;
      axesHelper.visible = !axesHelper.visible;
  }

  if(verify) cameraHolder.translateY(-speed * cont);

  if ( keyboard.pressed("Q") && cont <= 8)  {
    cont += 0.05;
  }
  if ( keyboard.pressed("A") && cont > 0.5)  { 
    cont -= 0.05; 
  }

  if( keyboard.pressed("up") )  cameraHolder.rotateX( -angle );
  if ( keyboard.pressed("down") )  cameraHolder.rotateX( angle );

  if ( keyboard.pressed("left") )  cameraHolder.rotateZ( -angle );
  if ( keyboard.pressed("right") )  cameraHolder.rotateZ( angle );

  if ( keyboard.pressed(",") )  aviao.rotateY( angle );
  if ( keyboard.pressed(".") )  aviao.rotateY( -angle );
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Controls");
    controls.addParagraph();
    controls.add("Enter to start moving")
    controls.add("Space to change camera mode")
    controls.add("Q to speed up");
    controls.add("A to speed down");
    controls.add("Up arrow to 'Picar'");
    controls.add("Down arrow to 'Cabrar'");
    controls.add("Left / Right arrow para o leme");
    controls.add(", or < / . or > para aileron")
    controls.show();
}

function render()
{
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
