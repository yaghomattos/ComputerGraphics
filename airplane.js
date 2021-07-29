import * as THREE from  '../build/three.module.js';

//var aviao = gerarAviao();

export function gerarAviao(){
  var aviao = new THREE.Object3D();
  aviao.add( gerarCorpo() );
  aviao.add( gerarCabine() );
  aviao.add( gerarCauda() );
  aviao.add( gerarLeme() );
  aviao.add( gerarEstab() );
  aviao.add( gerarAsa() );

  return aviao;
}

function gerarCorpo(){
  var cilindroGeometry = new THREE.CylinderGeometry(1,1,10,32);
  var cilindroMaterial = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(cilindroMaterial);

  var cilindro1 = new THREE.Mesh(cilindroGeometry, cilindroMaterial);
  return cilindro1;

}


function gerarCauda(){
  var cauda = new THREE.Object3D();
  var seg = 0.1, factor = 0.9997, aux1 = 1, aux2;

  var count = 0;
  for (var i = 0; aux1 > 0.3; i++){

    aux2 = aux1*(Math.pow(factor,1.5*i))

    var coneGeometry = new THREE.CylinderGeometry(aux1, aux2,seg,32);
    var coneMaterial = new THREE.MeshPhongMaterial({
      shininess: 100   
    });
    setColor(coneMaterial);

    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.translateY(-(5+i*seg+seg/2));
    cauda.add(cone);

    aux1 = aux2;
    count++;
  }
  return cauda;
}

function gerarCabine(){
  var cabine = new THREE.Object3D();
  var seg = 0.06, factor = 0.997, aux1 = 1, aux2;

  var count = 0;
  for (var i = 0; aux1 > 0.5; i++){

    aux2 = aux1*(Math.pow(factor,1.5*i))

    var coneGeometry = new THREE.CylinderGeometry(aux1, aux2,seg,32);
    var coneMaterial = new THREE.MeshPhongMaterial({
      shininess: 100     
    });
    setColor(coneMaterial);

    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.translateY((5+i*seg+seg/2));
    cone.rotateX(Math.PI);
    cabine.add(cone);

    aux1 = aux2;
    count++;
  }

  var curva = [];

  var dy = 0.11;
  curva.push( new THREE.Vector2(aux1, 0) );
  curva.push( new THREE.Vector2(9*aux1/10, dy) );
  curva.push( new THREE.Vector2(7*aux1/10, 2*dy) );
  curva.push( new THREE.Vector2(4*aux1/10, 3*dy) );
  curva.push( new THREE.Vector2(0, 4*dy) );

  var bicoGeometry = new THREE.LatheGeometry(curva, 32);

  var bicoMaterial = new THREE.MeshPhongMaterial({
    shininess: 10000
  });
  setColor(bicoMaterial);
  var bico = new THREE.Mesh(bicoGeometry, bicoMaterial);
  bico.translateY((5+count*seg));

  cabine.add(bico);
   
  return cabine;
}

function gerarLeme() {
  var shape = new THREE.Shape();

  shape.moveTo( 0,0 );
  shape.lineTo( 0, 3  );
  shape.lineTo( 4, 4.5  );
  shape.lineTo( 4, 3.5  );
  shape.lineTo( 0, 0  );

  
  var extrudeSettings = {
    steps: 10,
    depth: 0.2,
    bevelEnabled: false,
  };
  
  var lemeGeometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  var lemeMaterial = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(lemeMaterial);

  var leme = new THREE.Mesh( lemeGeometry, lemeMaterial ) ;

  leme.rotateX(Math.PI);
  leme.rotateY(Math.PI/2);
  leme.translateY(9);
  leme.translateZ(-0.1);

  return leme;

}


function gerarEstab() {
  var shape = new THREE.Shape();

  shape.moveTo( 0,0 );
  shape.lineTo( 4.5, 4  );
  shape.lineTo( 4.5, 4.5  );
  shape.lineTo( 0, 3  );
  shape.lineTo( -4.5, 4.5  );
  shape.lineTo( -4.5, 4 );
  shape.lineTo( 0, 0 );

  
  var extrudeSettings = {
    steps: 10,
    depth: 0.2,
    bevelEnabled: false,
  };
  
  var estabGeometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  var estabMaterial = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(estabMaterial);

  var estab = new THREE.Mesh( estabGeometry, estabMaterial ) ;

  estab.rotateX(Math.PI);
  estab.translateY(9);

  return estab;

}

function gerarAsa() {
  var shape = new THREE.Shape();

  shape.moveTo( 0,0 );
  shape.lineTo( 10, 5.5  );
  shape.lineTo( 10.5, 6.5  );
  shape.lineTo( 3.5, 5.0  );
  shape.lineTo( -3.5, 5.0  );
  shape.lineTo( -10.5, 6.5 );
  shape.lineTo( -10, 5.5 );
  shape.lineTo( 0, 0 );

  
  var extrudeSettings = {
    steps: 10,
    depth: 0.2,
    bevelEnabled: false,
  };
  
  var asaGeometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  var asaMaterial = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(asaMaterial);
  var asa = new THREE.Mesh( asaGeometry, asaMaterial ) ;

  asa.rotateX(Math.PI);

  var turbinas = new THREE.Object3D();

  var turbina1 = gerarTurbina();
  turbina1.translateX(4);

  var turbina2 = gerarTurbina();
  turbina2.translateX(-4);

  turbinas.add(turbina1);
  turbinas.add(turbina2);

  turbinas.translateZ(0.9);
  turbinas.translateY(3);

  asa.add(turbinas);

  asa.translateY(-2);
  
  return asa;

}


function gerarTurbina(){

  var turbina = new THREE.Object3D();
  
  var cylinderGeometry1 = new THREE.CylinderGeometry(0.5, 0.6,0.7,32);
  var cylinderMaterial1 = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(cylinderMaterial1);
  var cylinder1 = new THREE.Mesh(cylinderGeometry1, cylinderMaterial1);
  cylinder1.translateY(0.35);
  turbina.add(cylinder1);

  var cylinderGeometry2 = new THREE.CylinderGeometry(0.6, 0.5,0.7,32);
  var cylinderMaterial2 = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(cylinderMaterial2);
  var cylinder2 = new THREE.Mesh(cylinderGeometry2, cylinderMaterial2);
  cylinder2.translateY(-0.35);
  turbina.add(cylinder2);

  var cylinderGeometry3 = new THREE.CylinderGeometry(0.3, 0.4,0.4,32);
  var cylinderMaterial3 = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(cylinderMaterial3);
  var cylinder3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
  cylinder3.translateY(0.9);
  turbina.add(cylinder3);

  var cylinderGeometry4 = new THREE.CylinderGeometry(0, 0.2,0.3,32);
  var cylinderMaterial4= new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(cylinderMaterial4);
  var cylinder4 = new THREE.Mesh(cylinderGeometry4, cylinderMaterial4);
  cylinder4.translateY(1.25);
  turbina.add(cylinder4);

  var suporteGeometry = new THREE.BoxGeometry(0.2,0.8,0.8);
  var suporteMaterial = new THREE.MeshPhongMaterial({
    shininess: 100
  });
  setColor(suporteMaterial);
  var suporte = new THREE.Mesh(suporteGeometry, suporteMaterial);
  suporte.translateZ(-0.5)
  turbina.add(suporte);
  
  return turbina;
}

function setColor(material)
{
  material.color.setRGB(1, 1, 255);
}