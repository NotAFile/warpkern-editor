"use strict";

import Vue from "vue";
import "tachyons";

import extractMetadata from "./metadata";

window.extractMetadata = extractMetadata;

let vm = new Vue({
    el: "#app",
    data: {
        status: "ready",
        vim_mode: false,
        saved_shaders: {
            examples: [
                "examples/rainbow.glsl",
                "examples/bounce.glsl",
                "examples/crawl.glsl",
            ],
        },
        openModal: true,
    },
});


function loadExampleFromURI(uri){
    fetch(uri)
        .then(function(response) {
            console.log("loading " + uri);
            response.text().then(text => {
                console.log("loaded " + uri);
                editor.setValue(text, 1);
            }
            );
        });
}


function createShader(gl, type, source) {
    vm.staus = "Compiling Shader...";
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        vm.staus = "done!";
        return shader;
    }

    var faillog = gl.getShaderInfoLog(shader);
    console.log("shader compile failed");
    console.log(faillog);
    gl.deleteShader(shader);

    vm.status = faillog;
}

function createProgram(gl, vertexShader, fragmentShader) {
    vm.status = "Linking Program...";
    var program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        vm.staus = "done!";
        return program;
    }

    var faillog = gl.getProgramInfoLog(program);
    console.log("program link failed");
    console.log(faillog);
    gl.deleteProgram(program);

    vm.status = faillog;
}

const FPS = 20;
const ANIM_LENGTH = FPS * 10; // 10 seconds

class ShaderRenderer {
    constructor(canvas) {
        var gl = canvas.getContext("webgl");
        this.gl = gl;
        this.canvas = canvas;

        this.runAnimation = false;
        this.starttime = Date.now();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        this.vertexShader = vertexShader;

        this.createBuffers();
        this.reloadShader();

        console.log(this.program);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

    }

    createBuffers() {
        let gl = this.gl;
        var positionBuffer = gl.createBuffer();

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // three 2d points
        let positions = [
            -1, 1,
            1, 1,
            1, -1,
            -1, -1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    }

    configPositionAttribute(program) {
        let gl = this.gl;
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 2;          // 2 components per iteration
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer

        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

        gl.enableVertexAttribArray(positionAttributeLocation);

        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);

    }

    reloadShader() {
        var gl = this.gl;
        var fragmentShaderSource = editor.getValue();
        if (fragmentShaderSource === "") {
            console.log("empty shader");
            return false;
        }
        var fragmentShaderPreamble = document.getElementById("fragment-shader-preamble").text;
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderPreamble + fragmentShaderSource);
        if (!fragmentShader) {
            console.log("shader creation failed");
            return false;
        }
        var program = createProgram(gl, this.vertexShader, fragmentShader);

        this.configPositionAttribute(program);

        this.program = program;
        console.log("created program");
        vm.status = "running"; // Add Seconds
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        return true;
    }

    stop_live_render() {
        this.runAnimation = false;
    }

    start_live_render() {
        this.runAnimation = true;

        let self = this;

        function live_render() {
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
        let save = JSON.stringify({
            source: editor.getValue(),
            preview: this.render_save(),
            disclaimer: "please forgive us for this file format",
        });
        return "data:application/octet-stream," + encodeURIComponent(save);
    }

    render(gl, time) {
        if(!this.program) {
            // no valid compile
            return;
        }
        var resolutionUniformLocation = gl.getUniformLocation(this.program, "iResolution");
        gl.uniform2f(resolutionUniformLocation, 191, 12);
        var timeAttributeLocation = gl.getUniformLocation(this.program, "time");
        gl.uniform1f(timeAttributeLocation, time);

        var offset = 0;
        var count = 4;
        gl.drawArrays(gl.TRIANGLE_FAN, offset, count);
    }
}

function save(){
    let canvas = document.createElement("canvas");
    let renderer = new ShaderRenderer(canvas);
    let uri = renderer.render_to_data_uri();
    var dllink = document.getElementById("dllink");
    dllink.href = uri;
    dllink.click();
}

function on_play_shader() {
    var fragmentShaderSource = editor.getValue();
    localStorage.setItem("lastFragmentShader", fragmentShaderSource);
    live_renderer.reloadShader();
}

function on_stop_shader() {
    live_renderer.stop_live_render();
}

window.on_play_shader = on_play_shader;
window.on_stop_shader = on_stop_shader;
window.save = save;

vm.$watch("vim_mode", set_vim_mode);

function set_vim_mode(enabled) {
    if (enabled) {
        console.log("vim enabled");
        editor.setKeyboardHandler("ace/keyboard/vim");
    }
    else {
        console.log("vim disabled");
        editor.setKeyboardHandler(null);
    }
    localStorage.setItem("vimMode", enabled);
}

function load_vim() {
    vm.vim_mode = JSON.parse(localStorage.getItem("vimMode"));
}

var live_canvas = document.getElementById("render-canvas");

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/glsl");

window.editor = editor;

/*
ace.config.loadModule("ace/keyboard/vim", function(m) {
    var VimApi = require("ace/keyboard/vim").CodeMirror.Vim
    VimApi.defineEx("run", "r", function(cm, input) {
        cm.ace.execCommand("save")
    })
})
*/

load_vim();

let lastShader = localStorage.getItem("lastFragmentShader");
console.log(lastShader);
if (lastShader !== null) {
    editor.setValue(lastShader, 1);
} else {
    loadExampleFromURI(vm.saved_shaders.examples[2]);
}

var live_renderer;

window.onload = function() {
    console.log("load");
    live_renderer = new ShaderRenderer(live_canvas);
    live_renderer.start_live_render();
};
