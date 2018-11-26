"use strict";

var examples = [
    "/examples/rainbow.glsl",
    "/examples/bounce.glsl",
    "/examples/crawl.glsl",
]

function loadExampleFromURI(uri){
    fetch(uri)
        .then(function(response) {
            console.log("loaded " + uri);
            editor.setValue(response.text(), 1)
        });
}


function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        document.getElementById("status").innerHTML = "success";
        return shader;
    }

    var faillog = gl.getShaderInfoLog(shader);
    console.log("shader compile failed");
    console.log(faillog);
    gl.deleteShader(shader);

    document.getElementById("status").innerHTML = faillog;
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        document.getElementById("status").innerHTML = "success";
        return program;
    }

    var faillog = gl.getProgramInfoLog(program);
    console.log("program link failed");
    console.log(faillog);
    gl.deleteProgram(program);

    document.getElementById("status").text = faillog;
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
        if (!fragmentShader) {
            console.log("shader creation failed")
            return;
        }
        var program = createProgram(gl, this.vertexShader, fragmentShader);

        this.program = program;
        console.log("created program")
        var fragmentShaderPreamble = document.getElementById("fragment-shader-preamble").text;
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
        this.canvas.height = 12;
        this.canvas.width = 191;
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
        save = JSON.stringify({source: editor.getValue(), preview: this.render_save()});
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

function on_play_shader() {
    var fragmentShaderSource = editor.getValue();
    localStorage.setItem("lastFragmentShader", fragmentShaderSource);
    live_renderer.reloadShader();
}

function set_vim_mode(enabled) {
    if (enabled) {
        editor.setKeyboardHandler("ace/keyboard/vim");
    }
    else {
        editor.setKeyboardHandler(null);
    }
}

function toggle_vim() {
    let vim_mode = document.getElementById("vim_toggle").checked;
    set_vim_mode(vim_mode);
    localStorage.setItem("vimMode", vim_mode);
}

function load_vim() {
    let vim_mode = localStorage.getItem("vimMode");
    set_vim_mode(vim_mode);
    document.getElementById("vim_toggle").checked = vim_mode;
}

var live_canvas = document.getElementById("c");

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/glsl");

load_vim();

/*
let lastShader = localStorage.getItem("lastFragmentShader");
if (lastShader !== undefined) {
    editor.setValue(lastShader, 1);
}
else {
}
*/

var live_render;

window.onload = function() {
    console.log("load");
    loadExampleFromURI(examples[0]);
    live_renderer = new ShaderRenderer(live_canvas);
    // screen can only do 20 fps
    live_renderer.start_live_render()
}
