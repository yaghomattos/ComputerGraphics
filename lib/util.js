import * as THREE from 'three';

/**
 * Creates the WebGL renderer with shadows enabled and attaches it to #webgl-output.
 */
export function initRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('rgb(80, 80, 80)');
  document.getElementById('webgl-output').appendChild(renderer.domElement);
  return renderer;
}

/**
 * Updates the camera aspect ratio and renderer size to the current window.
 */
export function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Ground plane lying on the XY plane (Z up), receiving shadows.
 */
export function createGroundPlane(width, height, widthSegments = 1, heightSegments = 1, color = 'rgb(200,200,200)') {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);
  plane.receiveShadow = true;
  return plane;
}

/**
 * Small unlit sphere used to show where a light source is.
 */
export function createLightSphere(scene, radius, widthSegments, heightSegments, position) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const material = new THREE.MeshBasicMaterial({ color: 'rgb(255,255,50)' });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.visible = true;
  sphere.position.copy(position);
  scene.add(sphere);
  return sphere;
}

/**
 * Help panel shown at the top-left corner.
 */
export class InfoBox {
  constructor() {
    this.infoBox = document.createElement('div');
    this.infoBox.id = 'InfoxBox';
    Object.assign(this.infoBox.style, {
      padding: '6px 14px',
      position: 'fixed',
      top: '0',
      left: '0',
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      userSelect: 'none',
    });
  }

  add(text) {
    this.infoBox.appendChild(document.createTextNode(text));
    this.infoBox.appendChild(document.createElement('br'));
  }

  addParagraph() {
    this.infoBox.appendChild(document.createElement('br'));
  }

  show() {
    document.body.appendChild(this.infoBox);
  }
}

/**
 * Single-line HUD box, anchored to the bottom-left corner by default.
 */
export class SecondaryBox {
  constructor(defaultText) {
    this.box = document.createElement('div');
    Object.assign(this.box.style, {
      padding: '6px 14px',
      bottom: '0',
      left: '0',
      position: 'fixed',
      backgroundColor: 'rgba(100,100,255,0.3)',
      color: 'white',
      fontFamily: 'sans-serif',
      fontSize: '18px',
      userSelect: 'none',
    });
    this.textnode = document.createTextNode(defaultText);
    this.box.appendChild(this.textnode);
    document.body.appendChild(this.box);
  }

  changeMessage(newText) {
    this.textnode.nodeValue = newText;
  }
}
