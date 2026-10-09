import * as THREE from 'three';

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

export function generateTrack() {
  const curve = new THREE.CatmullRomCurve3(curveTrackPoints);
  const curvepoints = curve.getPoints(200);
  const curvegeometry = new THREE.BufferGeometry().setFromPoints( curvepoints);
  const curvematerial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
  const curveObject = new THREE.Line( curvegeometry, curvematerial );
  curveObject.rotateX(Math.PI/2);
  return curveObject;
}

function generateTorus(cor1, cor2, cor3) {
  const geometry = new THREE.TorusGeometry(25, 4, 10, 50);
  const material =  new THREE.MeshPhongMaterial( { opacity: 0.8 , transparent: true } ); 
  material.color.setRGB(cor1, cor2, cor3);
  const torus = new THREE.Mesh(geometry, material);
  return torus;
}

/* Track points use Y as height; the scene uses Z as height (see generateTrack's rotateX). */
function toScene(v) {
  return new THREE.Vector3(v.x, -v.z, v.y);
}

export function createCheckpoints() {
  var checkpoint = [];
  const curve = new THREE.CatmullRomCurve3(curveTrackPoints);

  
  for (var i=1, j=0; i < curveTrackPoints.length - 1; i++, j++){   

    var color = new THREE.Color();
    color.r = (Math.min(0.9, (0.1 + j*0.9/curveTrackPoints.length)));
    color.g = (Math.max(0, (0.9 - j*1.3/curveTrackPoints.length)));
    color.b = 0.3

    checkpoint[j] = generateTorus(color.r, color.g, color.b);
    if(i == curveTrackPoints.length - 2)
    {
      checkpoint[j].position.x = -846;
      checkpoint[j].position.y = -370;
      checkpoint[j].position.z = 50;
    }
    else{
      checkpoint[j].position.x = curveTrackPoints[i].x;
      checkpoint[j].position.y = -curveTrackPoints[i].z;
      checkpoint[j].position.z = curveTrackPoints[i].y;
    }

    // The torus axis (local Z) follows the track direction, so the ring faces the incoming plane.
    const tangent = toScene(curve.getTangent(i / (curveTrackPoints.length - 1)));
    checkpoint[j].lookAt(checkpoint[j].position.clone().add(tangent));
  }
  
  return checkpoint;
}

export function getRadius() {
  return generateTorus().geometry.parameters.radius;
}
