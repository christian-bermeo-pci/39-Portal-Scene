uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position,1.0);
    modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.2;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    // Setting size based on pixel ratio (same size for all screens)
    gl_PointSize = uSize * aScale * uPixelRatio;
    // size atenuation formula.. (near is big, far is small effect)
    gl_PointSize *= (1.0 / - viewPosition.z);
}