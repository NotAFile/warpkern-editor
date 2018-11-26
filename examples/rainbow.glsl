// time is a float between 0.0 and 10.0, representing the current time in seconds
// the animation loops every 10 seconds
uniform float time;

// If you make a cool animation, please give it a good filename.json and mail
// it to shaders (ät) notafile.com

void main() {
    // the warpcore resolution is 12x191 pixel
    // the canvas coordinates go from -1 to 1, with 0 in the middle

    // This function gets 'called' for each pixel in the image
    // set constants using const. Almost everything is a float,
    // don't forget to add the .0 at the end, else stuff breaks
    const float x_scale = 6.0;
    const float y_scale = 100.0;
    const float time_scaler = 20.0;

    // use gl_FragCoord to access the current coordinate
    float hue_1 = (gl_FragCoord.y + time * time_scaler) / x_scale;
    float hue_2 = gl_FragCoord.x / y_scale;
    vec3 rgb = hsl2rgb(mod(hue_1 + hue_2, 12.0) / 12.0, 1.0, 0.5);
    // gl_FragColor is a special variable in a fragment shader
    // it is responsible for setting the color of the pixel
    gl_FragColor = vec4(rgb, 1.0);
}

// a number of functions have already been defined:
// -- hsv
// vec3 hsv2rgb(h, s, v)
// vec3 hsv2rgb(vec3)
// -- random
// float rand(vec2) // vec2 is the seed
