"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

// a varying the color to the fragment shader
out vec4 v_color;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

// the varied color passed from the vertex shader
in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;

// First let's make some variables
// to hold the translation, rotation, scale, color and type of the object
var translation = [0, 0, 0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [1, 1, 1];

var tAdjust = [0, 0, 0];
var objectType = 'd';
var count = 24;


var viewmode = 'o';
var right = null, floor = null;
var left = 0, roof = 0;
var near = 400;
var far = -400;

// passos da translação
var xstep = 1, ystep = 1, zstep = 1;

// globals
var gl, program, vao;
var resolutionUniformLocation, colorLocation, matrixLocation;
var positionBuffer, colorBuffer;

function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	var body = document.getElementsByTagName("BODY")[0];
	var canvas = document.querySelector("#glCanvas");
	gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}

	// Use our boilerplate utils to compile the shaders and link into a program
  	program = webglUtils.createProgramFromSources(gl,[vertexShaderSource, fragmentShaderSource]);

	// look up where the vertex data needs to go.
	var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

	// look up uniform locations
	matrixLocation = gl.getUniformLocation(program, "u_matrix");

	// Create a buffer
	positionBuffer = gl.createBuffer();

	// Create a vertex array object (attribute state)
	vao = gl.createVertexArray();

	// and make it the one we're currently working with
	gl.bindVertexArray(vao);

	// Turn on the attribute
	gl.enableVertexAttribArray(positionAttributeLocation);

	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// Definir geometria.
	setGeometry(objectType);

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 3;          // 3 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

	// create the color buffer, make it the current ARRAY_BUFFER
  	// and copy in the color values
  	colorBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  	setColors(objectType);

  	// Turn on the attribute
  	gl.enableVertexAttribArray(colorAttributeLocation);

  	// Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
	size = 3;          // 3 components per iteration
	type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
	normalize = true;  // convert from 0-255 to 0.0-1.0
	stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
	offset = 0;        // start at the beginning of the buffer
  	gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

	drawScene();

	// Setup a ui.
	webglLessonsUI.setupSlider("#x",      {value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
	webglLessonsUI.setupSlider("#y",      {value: translation[1], slide: updatePosition(1), max: gl.canvas.height});
	webglLessonsUI.setupSlider("#z",      {value: translation[2], slide: updatePosition(2), max: gl.canvas.height});
	webglLessonsUI.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
	webglLessonsUI.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
	webglLessonsUI.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
	webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
	webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});
	webglLessonsUI.setupSlider("#scaleZ", {value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2});

	function updatePosition(index) {
		return function(event, ui) {
			translation[index] = ui.value;
			drawScene();
		};
	}

	function updateRotation(index) {
		return function(event, ui) {
			var angleInDegrees = ui.value;
			var angleInRadians = degToRad(angleInDegrees);
			rotation[index] = angleInRadians;
			drawScene();
		};
	}

	function updateScale(index) {
		return function(event, ui) {
			scale[index] = ui.value;
			drawScene();
		};
	}

	// assign events
	// usei para fins de redimensionamento da página
	body.onresize = function() {
		drawScene();
	};
	// esse evento não funciona no canvas, tive que usar o body
	body.onkeydown = function(ev) {
		// so com o atributo key que se consegue acessar as setas direcionais
		// console.log(ev.key);
		switch(ev.key) {
			case 'ArrowUp':
				if (xstep < 0) {
					--xstep;
				} else {
					++xstep;
				}
				if (ystep < 0) {
					--ystep;
				} else {	
					++ystep;
				}
				if (zstep < 0) {
					--zstep;
				} else {	
					++zstep;
				}
			break;
			case 'ArrowDown':
				if (xstep < 0) {
					++xstep;
				} else {
					--xstep;
				}
				if (ystep < 0) {
					++ystep;
				} else {	
					--ystep;
				}
				if (zstep < 0) {
					++zstep;
				} else {	
					--zstep;
				}
			break;
		}
	};

	// iniciando loop
	// requestAnimationFrame(saveScreen3D);
}

// Desenhe a cena.
function drawScene() {
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);

	// Diga a WebGL como converter de clip space para pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);

	// Diga para usar nosso programa (par de shaders)
	gl.useProgram(program);

	// Vincule o conjunto de atributos/buffers que queremos.
	gl.bindVertexArray(vao);

	// Compute the matrix
    right = gl.canvas.clientWidth;
    floor = gl.canvas.clientHeight;

    var matrix = [];

    if (viewmode == 'o') {
    	matrix = m4.orthographic(left, right, floor, roof, near, far);
    } else {
    	// perspective
    }

    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

   // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

	// Desenhe o retângulo.
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	gl.drawArrays(primitiveType, offset, count);
}

// Fill the buffer with the values that define a rectangle.
function setGeometry(code) {
	let arrayArgs = [];
	switch (code) {
		// cube
		case 'c': {
			arrayArgs = [
				// front square
				0, 0, 0,
				0, 200, 0,
				200, 0, 0,
				200, 0, 0,
				0, 200, 0,
				200, 200, 0,

				// back square
				0, 0, 200,
				200, 0, 200,
				0, 200, 200,
				0, 200, 200,
				200, 0, 200,
				200, 200, 200,

				// left square
				0, 0, 0,
				0, 0, 200,
				0, 200, 200,
				0, 200, 200,
				0, 200, 0,
				0, 0, 0,

				// right square
				200, 0, 0,
				200, 200, 200,
				200, 0, 200,
				200, 200, 200,
				200, 0, 0,
				200, 200, 0,

				// top square
				0, 0, 0,
				200, 0, 0,
				0, 0, 200,
				0, 0, 200,
				200, 0, 0,
				200, 0, 200,

				// bottom square
				0, 200, 0,
				0, 200, 200,
				200, 200, 0,
				200, 200, 0,
				0, 200, 200,
				200, 200, 200];
			count = 36;
		}
		break;
		// piramyd
		case 'p': {
			arrayArgs = [
				// front triangle
				100, 0, 100,
				0, 200, 0,
				200, 200, 0,

				// back triangle
				0, 200, 200,
				100, 0, 100,
				200, 200, 200,

				// left triangle
				0, 200, 0,
				100, 0, 100,
				0, 200, 200,

				// right triangle
				200, 200, 0,
				200, 200, 200,
				100, 0, 100,

				// bottom square
				0, 200, 0,
				0, 200, 200,
				200, 200, 0,
				200, 200, 0,
				0, 200, 200,
				200, 200, 200];
			count = 18;
		}
		break;
		// diamond
		case 'd': {
			arrayArgs = [
				// top front left
				100, 0, 100,
				0, 100, 100,
				100, 100, 0,

				// top front right
				100, 0, 100,
				100, 100, 0,
				200, 100, 100,

				// top back left
				0, 100, 100,
				100, 0, 100,
				100, 100, 200,

				// top back right
				100, 100, 200,
				100, 0, 100,
				200, 100, 100,

				// bottom front left
				0, 100, 100,
				100, 200, 100,
				100, 100, 0,

				// bottom front right
				100, 100, 0,
				100, 200, 100,
				200, 100, 100,

				// bottom back left
				100, 100, 200,
				100, 200, 100,
				0, 100, 100,

				// bottom back right
				200, 100, 100,
				100, 200, 100,
				100, 100, 200];
			count = 24;
		}
		break;
		case 'f': {
			arrayArgs = [
            // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0];
			count = 96;
		}
		break;
	}
	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayArgs), gl.STATIC_DRAW);
}

function setColors(code) {
	let arrayArgs = [];
	switch(code) {
		// cube
		case 'c': {
			arrayArgs = [
				// front square
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,

				// back square
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,

				// left square
				160, 160, 220,
				160, 160, 220,
				160, 160, 220,
				160, 160, 220,
				160, 160, 220,
				160, 160, 220,

				// right square
				76, 210, 100,
				76, 210, 100,
				76, 210, 100,
				76, 210, 100,
				76, 210, 100,
				76, 210, 100,

				// top square
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,

				// bottom square
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110];
		}
		break;
		// piramyd
		case 'p': {
			arrayArgs = [
				// front triangle
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,

				// back triangle
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,

				// left triangle
				160, 160, 220,
				160, 160, 220,
				160, 160, 220,

				// right triangle
				76, 210, 100,
				76, 210, 100,
				76, 210, 100,

				// bottom square
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,
				90, 130, 110];
		}
		break;
		// diamond
		case 'd': {
			arrayArgs = [
				// top front left
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,

				// top front right
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,

				// top back left
				90, 130, 110,
				90, 130, 110,
				90, 130, 110,

				// top back right
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,

				// bottom front left
				200,  70, 120,
				200,  70, 120,
				200,  70, 120,

				// bottom front right
				70, 200, 210,
				70, 200, 210,
				70, 200, 210,

				// bottom back left
				80, 70, 200,
				80, 70, 200,
				80, 70, 200,

				// bottom back right
				90, 130, 110,
				90, 130, 110,
				90, 130, 110];
		}
		break;
		// letter f
		case 'f': {
			arrayArgs = [
	         // left column front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // top rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // middle rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // left column back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // middle rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,

          // top rung right
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,

          // under top rung
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,

          // between top rung and middle
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,

          // top of middle rung
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,

          // right of middle rung
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,

          // bottom of middle rung.
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,

          // right of bottom
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,

          // bottom
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,

          // left side
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220];
		}
		break;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER,new Uint8Array(arrayArgs),gl.STATIC_DRAW);
}

function switchObject (code) {
	setGeometry(code);
	setColors(code);
	drawScene();
}

function switchView(mode,code) {
	viewmode = mode;
	switch (code) {
		case 'vf': {

		}
		break;
		case 'vs': {

		}
		break;
		case 'vl': {

		}
		break;
		case 'is': {

		}
		break;
		case 1: {

		}
		break;
		case 2: {

		}
		break;
		case 3: {

		}
		break;
	}

	drawScene();
}


function saveScreen3D() {
	// console.log(translation,gl.canvas.width, gl.canvas.height);

	// Muda a direção quando chega na borda esquerda ou direita
    if(translation[0] > (gl.canvas.width - width) || translation[0] < 0) {
		xstep = -xstep;
    }

    // Muda a direção quando chega na borda superior ou inferior
    if(translation[1] > (gl.canvas.height - height) || translation[1] < 0) {
    	ystep = -ystep;
    }
          
    // Verifica as bordas.  Se a window for menor e o 
    // quadrado sair do volume de visualização 
    if(translation[0] > (gl.canvas.width - width)) {
        translation[0] = gl.canvas.width - width - 1;
    } else if(translation[0] < 0) {
		translation[0] = 1;
    }

    if(translation[1] > (gl.canvas.height - height)) {
        translation[1] = gl.canvas.height-height-1;
    } else if (translation[1] < 0) {
    	translation[1] = 1;
    }

    // move o objeto

    translation[0] += xstep;
    translation[1] += ystep;

	drawScene();

	requestAnimationFrame(saveScreen3D);
}

function radToDeg(r) {
	return r * 180 / Math.PI;
}

function degToRad(d) {
	return d * Math.PI / 180;
}

var m4 = {
	orthographic: function(l, r, b, t, n, f) {
		return [
			2 / (r - l), 0, 0, 0,
			0, 2 / (t - b), 0, 0,
			0, 0, 2 / (n - f), 0,

			(l + r) / (l - r),
			(b + t) / (b - t),
			(n + f) / (n - f),
			1
		];
	},
	projection: function(w, h, d) {
		// Note: This matrix flips the Y axis so 0 is at the top.
		return [
		   2 / w, 0, 0, 0,
		   0, -2 / h, 0, 0,
		   0, 0, 2 / d, 0,
		  -1, 1, 0, 1,
		];
	},

	multiply: function(a, b) {
		var a00 = a[0 * 4 + 0];
		var a01 = a[0 * 4 + 1];
		var a02 = a[0 * 4 + 2];
		var a03 = a[0 * 4 + 3];
		var a10 = a[1 * 4 + 0];
		var a11 = a[1 * 4 + 1];
		var a12 = a[1 * 4 + 2];
		var a13 = a[1 * 4 + 3];
		var a20 = a[2 * 4 + 0];
		var a21 = a[2 * 4 + 1];
		var a22 = a[2 * 4 + 2];
		var a23 = a[2 * 4 + 3];
		var a30 = a[3 * 4 + 0];
		var a31 = a[3 * 4 + 1];
		var a32 = a[3 * 4 + 2];
		var a33 = a[3 * 4 + 3];
		var b00 = b[0 * 4 + 0];
		var b01 = b[0 * 4 + 1];
		var b02 = b[0 * 4 + 2];
		var b03 = b[0 * 4 + 3];
		var b10 = b[1 * 4 + 0];
		var b11 = b[1 * 4 + 1];
		var b12 = b[1 * 4 + 2];
		var b13 = b[1 * 4 + 3];
		var b20 = b[2 * 4 + 0];
		var b21 = b[2 * 4 + 1];
		var b22 = b[2 * 4 + 2];
		var b23 = b[2 * 4 + 3];
		var b30 = b[3 * 4 + 0];
		var b31 = b[3 * 4 + 1];
		var b32 = b[3 * 4 + 2];
		var b33 = b[3 * 4 + 3];
		return [
		  b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
		  b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
		  b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
		  b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
		  b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
		  b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
		  b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
		  b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
		  b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
		  b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
		  b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
		  b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
		  b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
		  b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
		  b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
		  b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
		];
	},

	translation: function(tx, ty, tz) {
		return [
		   1,  0,  0,  0,
		   0,  1,  0,  0,
		   0,  0,  1,  0,
		   tx, ty, tz, 1
		];
	},

	xRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [
		  1, 0, 0, 0,
		  0, c, s, 0,
		  0, -s, c, 0,
		  0, 0, 0, 1
		];
	},

	yRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [
		  c, 0, -s, 0,
		  0, 1, 0, 0,
		  s, 0, c, 0,
		  0, 0, 0, 1
		];
	},

	zRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [
		   c, s, 0, 0,
		  -s, c, 0, 0,
		   0, 0, 1, 0,
		   0, 0, 0, 1
		];
	},

	scaling: function(sx, sy, sz) {
		return [
		  sx, 0,  0,  0,
		  0, sy,  0,  0,
		  0,  0, sz,  0,
		  0,  0,  0,  1
		];
	},

	translate: function(m, tx, ty, tz) {
		return m4.multiply(m, m4.translation(tx, ty, tz));
	},

	xRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.xRotation(angleInRadians));
	},

	yRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.yRotation(angleInRadians));
	},

	zRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.zRotation(angleInRadians));
	},

	scale: function(m, sx, sy, sz) {
		return m4.multiply(m, m4.scaling(sx, sy, sz));
	}
};