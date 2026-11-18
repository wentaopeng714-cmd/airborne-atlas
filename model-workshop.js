import * as T from './vendor/three/three.module.min.js';

const primitiveCache=new Map();
const colorCache=new Map();
const up=new T.Vector3(0,1,0);
function geometry(key,create){
  let value=primitiveCache.get(key);
  if(!value){value=create();primitiveCache.set(key,value)}
  return value;
}
function colorOf(value){
  let color=colorCache.get(value);
  if(!color){color=new T.Color(value);colorCache.set(value,color)}
  return color;
}
function bucket(){return {position:[],normal:[],color:[],assemblyPivot:[],index:[]}}
function finish(part){
  if(!part.index.length)return null;
  const result=new T.BufferGeometry();
  for(const name of ['position','normal','color','assemblyPivot'])result.setAttribute(name,new T.Float32BufferAttribute(part[name],3));
  result.setIndex(part.index);result.computeBoundingSphere();result.computeBoundingBox();
  return result;
}

// All solid pieces of a miniature share vertex-coloured geometry. A complete model
// normally costs one draw for its body and one more for its luminous glass.
export class MiniatureBuilder{
  constructor(){
    this.motions=[];this.body=bucket();this.luminous=bucket();this.pose=new T.Object3D();
    this.normalMatrix=new T.Matrix3();this.vector=new T.Vector3();this.direction=new T.Vector3();
  }
  glow(color){return '@'+color}
  put(shape,x,y,z,w,h,d,paint,ax=0,ay=0,az=0,orient=null){
    const lamp=typeof paint==='string'&&paint[0]==='@',part=lamp?this.luminous:this.body;
    const tint=colorOf(lamp?paint.slice(1):paint),pose=this.pose;
    pose.position.set(x,y,z);pose.scale.set(w,h,d);
    if(orient)pose.quaternion.copy(orient);else pose.rotation.set(ax,ay,az);
    pose.updateMatrix();const nMatrix=this.normalMatrix.getNormalMatrix(pose.matrix);
    const pos=shape.attributes.position,norm=shape.attributes.normal,base=part.position.length/3;
    for(let i=0;i<pos.count;i++){
      const v=this.vector.fromBufferAttribute(pos,i).applyMatrix4(pose.matrix);
      part.position.push(v.x,v.y,v.z);
      v.fromBufferAttribute(norm,i).applyNormalMatrix(nMatrix);
      part.normal.push(v.x,v.y,v.z);part.color.push(tint.r,tint.g,tint.b);part.assemblyPivot.push(x,y,z);
    }
    if(shape.index){for(const i of shape.index.array)part.index.push(base+i)}
    else for(let i=0;i<pos.count;i++)part.index.push(base+i);
  }
  box(x,y,z,w,h,d,color,ax=0,ay=0,az=0){
    this.put(geometry('box',()=>new T.BoxGeometry()),x,y,z,w,h,d,color,ax,ay,az);
  }
  ell(x,y,z,w,h,d,color,ax=0,ay=0,az=0){
    this.put(geometry('sphere',()=>new T.SphereGeometry(1,12,8)),x,y,z,w,h,d,color,ax,ay,az);
  }
  tapered(top,bottom,sides){
    const r=Math.max(top,bottom,.0001),rt=Math.round(top/r*100),rb=Math.round(bottom/r*100);
    return geometry('c'+sides+'-'+rt+'-'+rb,()=>new T.CylinderGeometry(rt/100,rb/100,1,sides));
  }
  cyl(x,y,z,top,bottom,height,color,sides=12,ax=0,ay=0,az=0){
    const r=Math.max(top,bottom);
    this.put(this.tapered(top,bottom,sides),x,y,z,r,height,r,color,ax,ay,az);
  }
  rod(x,y,z,X,Y,Z,r,color,rTop=r,sides=8){
    const dir=this.direction.set(X-x,Y-y,Z-z),length=dir.length();
    if(length<.00001)return;
    const q=new T.Quaternion().setFromUnitVectors(up,dir.multiplyScalar(1/length));
    const radius=Math.max(r,rTop);
    this.put(this.tapered(rTop,r,sides),(x+X)/2,(y+Y)/2,(z+Z)/2,radius,length,radius,color,0,0,0,q);
  }
  ring(x,y,z,major,tube,color,ax=0,ay=0,az=0){
    const ratio=Math.round(1000*tube/major);
    this.put(geometry('tor'+ratio,()=>new T.TorusGeometry(1,ratio/1000,6,24)),x,y,z,major,major,major,color,ax,ay,az);
  }
  form(points,depth,x,y,z,color,ax=0,ay=0,az=0){
    if(points.length<3)return;
    const path=new T.Shape();
    points.forEach(([u,v],i)=>i?path.lineTo(u,v):path.moveTo(u,v));path.closePath();
    const bevel=Math.min(.016,depth*.13);
    const shape=new T.ExtrudeGeometry(path,{depth:Math.max(.001,depth-2*bevel),bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1,curveSegments:4});
    shape.translate(0,0,-depth*.5+bevel);
    this.put(shape,x,y,z,1,1,1,color,ax,ay,az);shape.dispose();
  }
  motion(type,pivot,draw){
    const body=this.body,lamps=this.luminous;
    this.body=bucket();this.luminous=bucket();
    try{
      draw();
      const parts={type,pivot,body:finish(this.body),luminous:finish(this.luminous)};
      for(const layer of ['body','luminous']){
        const geometry=parts[layer];if(!geometry)continue;
        geometry.translate(-pivot[0],-pivot[1],-pivot[2]);
        const centers=geometry.attributes.assemblyPivot;
        for(let i=0;i<centers.count;i++)centers.setXYZ(i,centers.getX(i)-pivot[0],centers.getY(i)-pivot[1],centers.getZ(i)-pivot[2]);
      }
      this.motions.push(parts);
    }finally{this.body=body;this.luminous=lamps}
  }
  finish(){return {body:finish(this.body),luminous:finish(this.luminous),motions:this.motions}}
}

export function makeMaterials(){
  const body=new T.MeshStandardMaterial({vertexColors:true,roughness:.69,metalness:.07});
  const luminous=new T.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.12,emissive:0xffffff,emissiveIntensity:.05});
  luminous.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb;');
  };
  return {body,luminous};
}

// A stem spreads its petals from their own centres. A building seats its plinth,
// walls and roof in order. The depth pass uses exactly the same movement.
export function assemblyMaterials(base){
  const progress={value:0},organic={value:0};
  const vertex=`
    float band=clamp(assemblyPivot.y/1.65,0.0,1.0);
    float p=clamp((atlasProgress-.41*band)/.59,0.0,1.0);
    float eased=p*p*(3.0-2.0*p);
    vec3 local=transformed-assemblyPivot;
    float angle=(1.0-eased)*atlasOrganic*1.20*sin(assemblyPivot.x*9.1+assemblyPivot.z*4.8+.5);
    float co=cos(angle),si=sin(angle);
    local.xy=mat2(co,-si,si,co)*local.xy;
    local.xz*=mix(eased,sqrt(eased),atlasOrganic);
    local.y*=eased;
    transformed=assemblyPivot+local;
    transformed.xz*=mix(1.0,.61+.39*eased,atlasOrganic);
    transformed.y=assemblyPivot.y*mix(1.0,.47+.53*eased,atlasOrganic)+local.y;
    transformed.y+=(1.0-atlasOrganic)*(1.0-eased)*.46;
  `;
  const make=(mat,kind,prior)=>{
    mat.onBeforeCompile=(shader,renderer)=>{
      if(prior)prior(shader,renderer);
      shader.uniforms.atlasProgress=progress;shader.uniforms.atlasOrganic=organic;
      shader.vertexShader='attribute vec3 assemblyPivot;\nuniform float atlasProgress;\nuniform float atlasOrganic;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+vertex);
    };
    mat.customProgramCacheKey=()=>'atlas-build-'+kind;
    return mat;
  };
  return {progress,organic,body:make(base.body.clone(),'body'),luminous:make(base.luminous.clone(),'lamp',base.luminous.onBeforeCompile),
    depth:make(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),'depth')};
}
