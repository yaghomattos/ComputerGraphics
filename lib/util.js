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
 * Merges every mesh of a static model into one mesh per material, with vertices in world space.
 * Each mesh costs a draw call per render pass, so a model made of thousands of small meshes is
 * CPU bound; merged, it costs one draw call per material.
 * Expects non-indexed geometries with position/normal/uv, as OBJLoader produces.
 */
export function mergeByMaterial(model) {
  model.updateMatrixWorld(true);
  const buckets = new Map(); // material -> { position, normal, uv }
  const vector = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();

  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const { position, normal, uv } = mesh.geometry.attributes;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = mesh.geometry.groups.length
      ? mesh.geometry.groups
      : [{ start: 0, count: position.count, materialIndex: 0 }];
    normalMatrix.getNormalMatrix(mesh.matrixWorld);

    for (const group of groups) {
      const material = materials[group.materialIndex || 0];
      if (!buckets.has(material)) buckets.set(material, { position: [], normal: [], uv: [] });
      const bucket = buckets.get(material);
      const end = group.count >= 0 ? Math.min(group.start + group.count, position.count) : position.count;
      for (let i = group.start; i < end; i++) {
        vector.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        bucket.position.push(vector.x, vector.y, vector.z);
        if (normal) {
          vector.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize();
          bucket.normal.push(vector.x, vector.y, vector.z);
        }
        if (uv) bucket.uv.push(uv.getX(i), uv.getY(i));
      }
    }
  });

  const merged = new THREE.Group();
  for (const [material, bucket] of buckets) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(bucket.position, 3));
    if (bucket.normal.length) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normal, 3));
    if (bucket.uv.length) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uv, 2));
    merged.add(new THREE.Mesh(geometry, material));
  }
  return merged;
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
