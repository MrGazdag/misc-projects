#version 300 es
precision mediump float;

out vec4 fragColor;
#include "./utils/constants.glsl"

void main() {
    fragColor = vec4(vec3(HEADER_COLOR)/255., 1.);
}