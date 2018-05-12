"use strict";

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const FPS = 20;
const ANIM_LENGTH = FPS * 10; // 10 seconds

class ShaderRenderer {
    constructor(canvas) {
        var gl = canvas.getContext("webgl");
        this.gl = gl
        this.canvas = canvas

        this.runAnimation = false;
        this.starttime = Date.now();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        this.vertexShader = vertexShader;
        this.reloadShader();

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        var positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");

        // three 2d points
        var positions = [
          -1, 1,
          1, 1,
          1, -1,
          -1, -1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enableVertexAttribArray(positionAttributeLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset)
    }

    reloadShader() {
        var gl = this.gl;
        var fragmentShaderSource = editor.getValue();
        var fragmentShaderPreamble = document.getElementById("fragment-shader-preamble").text;
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderPreamble + fragmentShaderSource);
        var program = createProgram(gl, this.vertexShader, fragmentShader);

        this.program = program;
        console.log("created program")
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
    }

    start_live_render() {
        this.runAnimation = true;

        let self = this

        function live_render(renderer) {
            let time = Date.now() - self.starttime;

            let frame = Math.round(time / (1000 / FPS), 0) % ANIM_LENGTH;

            if (self.runAnimation) {
                self.render(self.gl, frame / FPS);
                window.requestAnimationFrame(live_render);
            }
        }
        live_render();
    }

    render_save(){
        var frames = [];

        for (var frame=0; frame < ANIM_LENGTH; frame ++){
            this.render(this.gl, frame / FPS);
            frames.push(this.canvas.toDataURL());
        }

        return frames;
    }

    render_to_data_uri(){
        if (this.runAnimation){
            return;
        }
        save = JSON.stringify(this.render_save());
        return "data:application/octet-stream," + encodeURIComponent(save);
    }

    render(gl, time) {
        var timeAttributeLocation = gl.getUniformLocation(this.program, "time");
        gl.uniform1f(timeAttributeLocation, time);

        var primitiveType = 6;
        var offset = 0;
        var count = 4;
        gl.drawArrays(primitiveType, offset, count);
    }
}

function save(){
    let canvas = document.createElement("canvas");
    let renderer = new ShaderRenderer(canvas);
    let uri = renderer.render_to_data_uri();
    dllink = document.getElementById("dllink")
    dllink.href = uri;
    dllink.click()
}

var live_canvas = document.getElementById("c");

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/glsl");

// screen can only do 20 fps
var live_renderer = new ShaderRenderer(live_canvas);
live_renderer.start_live_render()
