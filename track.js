import * as THREE from 'three';

/* Track control points, with Y as height (the track is rotated to the Z-up scene in generateTrack). */
var curveTrackPoints = [
    new THREE.Vector3(1500, 0, 50),
    new THREE.Vector3(989, 30, -652),
    new THREE.Vector3(421, 200, -982),
    new THREE.Vector3(-470, 200, -779),
    new THREE.Vector3(-554, 80, -210),
    new THREE.Vector3(-714, 100, 753),
    new THREE.Vector3(-276, 100, 1454),
    new THREE.Vector3(168, 100, 1213),
    new THREE.Vector3(504, 100, 199),
    new THREE.Vector3(1600, 100, -1183),
    new THREE.Vector3(2368, 50, -1046),
    new THREE.Vector3(2333, 80, -486),
    new THREE.Vector3(1382, 90, 489),
    new THREE.Vector3(366, 50, 436),
    new THREE.Vector3(-846, 50, 367),
  ]

const curve = new THREE.CatmullRomCurve3(curveTrackPoints);

export const CHECKPOINT_RADIUS = 25;
const checkpointGeometry = new THREE.TorusGeometry(CHECKPOINT_RADIUS, 4, 10, 50);

export function generateTrack() {
  const curvepoints = curve.getPoints(200);
  const curvegeometry = new THREE.BufferGeometry().setFromPoints( curvepoints);
  const curvematerial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
  const curveObject = new THREE.Line( curvegeometry, curvematerial );
  curveObject.rotateX(Math.PI/2);
  return curveObject;
}

function generateTorus(color) {
  const material = new THREE.MeshPhongMaterial({ color, opacity: 0.8, transparent: true });
  return new THREE.Mesh(checkpointGeometry, material);
}

/* Converts a track vector (Y up) to the scene (Z up), matching generateTrack's rotateX. */
function toScene(v) {
  return new THREE.Vector3(v.x, -v.z, v.y);
}

/**
 * One ring on every track point after the start, colored from green (first) to red (last),
 * facing the track direction.
 */
export function createCheckpoints() {
  var checkpoint = [];
  const last = curveTrackPoints.length - 1;

  for (var i = 1, j = 0; i <= last; i++, j++) {
    const color = new THREE.Color(
      Math.min(0.9, 0.1 + j * 0.9 / last),
      Math.max(0, 0.9 - j * 1.3 / last),
      0.3
    );

    checkpoint[j] = generateTorus(color);
    checkpoint[j].position.copy(toScene(curveTrackPoints[i]));

    // The torus axis (local Z) follows the track direction, so the ring faces the incoming plane.
    const tangent = toScene(curve.getTangent(i / last));
    checkpoint[j].lookAt(checkpoint[j].position.clone().add(tangent));
  }

  return checkpoint;
}
