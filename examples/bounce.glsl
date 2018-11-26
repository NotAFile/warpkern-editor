uniform float time;

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.3),
                         _radius+(_radius*1.0),
                         dot(dist,dist)*4.0);
}

void main() {
    // This function gets 'called' for each pixel in the image
    // set constants using const. Almost everything is a float,
    // don't forget to add the .0 at the end, else stuff breaks
    const float x_scale = 100.0;
    const float y_scale = 3.0;
    const float time_scaler = 10.0;
    
    vec2 scale = vec2(x_scale, y_scale);
    
    vec3 rgb = hsl2rgb(mod(time * 0.1, 1.0), 1.0, 0.7);
    
    vec2 st = (gl_FragCoord.xy + vec2(-time * 100.0, -abs(sin(time) * 8.0)))/scale;
    st.x = mod(st.x, 2.0);

    vec3 color = vec3(circle(st,0.9));

    gl_FragColor = vec4( color * rgb, 1.0 );
}
