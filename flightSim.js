import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        createGroundPlaneWired,
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";


var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 40)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

/* sets the position of the camera at the backward of the plane */
camera.position.set(0.0, 20.0, 0.0); 
camera.lookAt(0.0, 0.0, 0.0);
camera.up.set(0.0, 0.0, 0.0); 

/**
 * simple light 
 */
var light =  new THREE.HemisphereLight();
scene.add(light);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

/**
 * wireframe plan
 */
var groundPlane = createGroundPlaneWired(500, 500);
groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);


/**
 * axis for reference
 */
var axesHelper = new THREE.AxesHelper(20);
scene.add( axesHelper );

/**
 * Airplane, famous flying cube
 */
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cubeMaterial = new THREE.MeshNormalMaterial();
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0.0, 0.0, 3.0);
cube.rotateX(0.2);
scene.add(cube);

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
cameraHolder.position.set(0, 0, -10)
scene.add(cameraHolder);
cameraHolder.add(camera);
cameraHolder.add(cube);

render();

const speed = 1.0; /* sets the initial speed */
let cont = 0.8; /* sets initial speed multiplication */
let verify = false; /* movement check */

var angle = degreesToRadians(2); 

async function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.pressed("space") ) {
    verify = !verify;
  }

  if(verify) cameraHolder.translateY(-speed * cont);

  if ( keyboard.pressed("Q") && cont <= 8)  {
    cont += 0.05;
  }
  if ( keyboard.pressed("A") && cont > 0.5)  { 
    cont -= 0.05; 
  }

  if( keyboard.pressed("up") )  cameraHolder.rotateX( angle );
  if ( keyboard.pressed("down") )  cameraHolder.rotateX( -angle );

  if ( keyboard.pressed("left") )  cameraHolder.rotateZ( -angle );
  if ( keyboard.pressed("right") )  cameraHolder.rotateZ( angle );

  if ( keyboard.pressed(",") )  cameraHolder.rotateY( angle );
  if ( keyboard.pressed(".") )  cameraHolder.rotateY( -angle );
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Controls");
    controls.addParagraph();
    controls.add("Space to start move")
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
