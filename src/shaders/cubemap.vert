#version 300 es 
 
in vec3 aPosition; 

out vec3 oTexCoord; 

uniform mat4 model; 
uniform mat4 view; 
uniform mat4 projection; 

void main(void) 
{ 
    oTexCoord = aPosition; 
    vec4 pos = projection * model * view * vec4(aPosition, 1.0); 
    gl_Position = pos; 
}
