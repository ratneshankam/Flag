#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_mvpMatrix;
out vec2 a_texcoord_out;

void main(void)
{
   gl_Position = u_mvpMatrix * a_position;
   a_texcoord_out = a_texcoord;
}
