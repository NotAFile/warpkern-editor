uniform float time;

void main() {
    // This function gets 'called' for each pixel in the image
    // set constants using const. Almost everything is a float,
    // don't forget to add the .0 at the end, else stuff breaks
    const float x_scale = 6.0;
    const float y_scale = 100.0;
    const float time_scaler = 20.0;
    
    const float width = 3.0;

    // use gl_FragCoord to access the current coordinate
    float hue_1 = (gl_FragCoord.y + time * time_scaler) / x_scale;
    float hue_2 = gl_FragCoord.x / y_scale;
    vec3 rgb = hsl2rgb(mod(hue_1 + hue_2, 12.0) / 12.0, 1.0, 0.5);
    // gl_FragColor is a special variable in a fragment shader
    // it is responsible for setting the color of the pixel
    float col = rand(vec2(0.0, floor(gl_FragCoord.x / width)));
    float d = mod(time / 3.0, 10.0) - 2.5 + col;
    float col2 = float(min(gl_FragCoord.y/10.0 + d, 1.0 - (gl_FragCoord.y/10.0 + d)) + 0.3 > 0.3);
    float col3 = float(col < col2);
    float holes = float(mod(gl_FragCoord.x, width * 2.0) > width);
    gl_FragColor = vec4(col3 * holes * vec3(0.0, 0.8, 1.0), 1.0);
}
