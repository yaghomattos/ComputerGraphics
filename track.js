import * as THREE from '../build/three.module.js';

var curveTrackPoints = [
    new THREE.Vector3(0, 0, 0),   
    new THREE.Vector3(0, 30, -200),                          
    new THREE.Vector3(100, 50, -800),
    new THREE.Vector3(500, 50, -2000),
    new THREE.Vector3(1000, 80, -3000),
    new THREE.Vector3(500, 200, -4000),
    new THREE.Vector3(0, 200, -4500),
    new THREE.Vector3(1400, 500, -6000),
    new THREE.Vector3(1000, 500, -7000),
    new THREE.Vector3(500, 200, -8000),
    new THREE.Vector3(800, 50, -9000),
    new THREE.Vector3(3000, 80, -5000),    
    new THREE.Vector3(2500, 90, -3000),    
    new THREE.Vector3(1000, 50, -1000),    
    new THREE.Vector3(100, 0, 0),  
  ]     

export function generateTrack() {
  const curve = new THREE.CatmullRomCurve3(curveTrackPoints);
  const curvepoints = curve.getPoints( 300 );
  const curvegeometry = new THREE.BufferGeometry().setFromPoints( curvepoints);
  const curvematerial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
  const curveObject = new THREE.Line( curvegeometry, curvematerial );
  curveObject.rotateX(Math.PI/2);
  return curveObject;
}

function generateTorus() {
  const geometry = new THREE.TorusGeometry(25, 4, 10, 50);
  const material =  new THREE.MeshBasicMaterial( { color: 0xc94600, opacity: 0.8 , transparent: true } ); 
  const torus = new THREE.Mesh(geometry, material);
  return torus;
}

export function createCheckpoints() {
  var checkpoint = [];
  
  for (var i=1, j=0; i < curveTrackPoints.length - 1; i++, j++){

    checkpoint[j] = generateTorus();
    if(i == curveTrackPoints.length - 2)
    {
      checkpoint[j].position.x = 100;
      checkpoint[j].position.y = 0;
      checkpoint[j].position.z = 0;
      checkpoint[j].lookAt(checkpoint[j].position);
      checkpoint[j].rotateX(Math.PI/2);
    }
    else{
      checkpoint[j].position.x = curveTrackPoints[i].x;
      checkpoint[j].position.y = -curveTrackPoints[i].z;
      checkpoint[j].position.z = curveTrackPoints[i].y;
      checkpoint[j].lookAt(checkpoint[j].position);
      checkpoint[j].rotateX(Math.PI/2);
    }
  }
  
  return checkpoint;
}