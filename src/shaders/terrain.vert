#version 300 es

in vec4 aPosition;
in vec3 aNormal;
in vec3 aColor;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
out vec3 out_color;
out vec3 out_normal;
out vec3 out_fragPos;

void main(void)
{
  // Code
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
  out_color = aColor;
  out_normal = mat3(uModelMatrix) * aNormal;
  out_fragPos = vec3(uModelMatrix * aPosition);
}
