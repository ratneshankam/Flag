#version 300 es 

precision highp float;

out vec2 a_texcoord_out;

void main(void) 
{
    float x = float((gl_VertexID & 1) << 2);
    float y = float((gl_VertexID & 2) << 1);
    
    a_texcoord_out.x = x * 0.5;
    a_texcoord_out.y = y * 0.5;
    
    gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);
}
