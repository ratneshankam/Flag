#version 300 es 

precision highp float; 

in vec3 oTexCoord; 

uniform samplerCube uTextureSampler2; 

out vec4 FragColor; 

void main(void) 
{ 
    FragColor = texture(uTextureSampler2, oTexCoord); 
}
