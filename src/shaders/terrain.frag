#version 300 es
precision highp float;

in vec3 out_color;
in vec3 out_normal;
in vec3 out_fragPos;
out vec4 FragColor;

void main(void)
{
    // Code
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
    vec3 normal = normalize(out_normal);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 ambient = out_color * 0.5;
    vec3 diffuse = out_color * diff * 0.7;
    vec3 finalColor = ambient + diffuse;
    // Add distance fog
    float dist = length(out_fragPos);
    float fogAmount = smoothstep(15.0, 35.0, dist);
    vec3 fogColor = vec3(0.6, 0.7, 0.8);
    // finalColor = mix(finalColor, fogColor, fogAmount);
    FragColor = vec4(finalColor, 1.0);
}
        