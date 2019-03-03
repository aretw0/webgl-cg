"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

// First let's make some variables
// to hold the translation, width, height and type of the object
var translation = [0,0];
var width = 100;
var height = 100;
var colorObject = [255, 0, 0, 1];
var objectType = 's';
var count = 6;

// passos da translação
var xstep = 1, ystep = 1;

// globals
var gl, program, vao, resolutionUniformLocation, colorLocation, positionBuffer;

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

	// look up uniform locations
	resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	colorLocation = gl.getUniformLocation(program, "u_color");

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

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 2;          // 2 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

	drawScene();  

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
			break;
		}
	};

	// iniciando loop
	requestAnimationFrame(saveScreen);
}

function drawScene() {
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);

	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Clear the canvas
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	// Bind the attribute/buffer set we want.
	gl.bindVertexArray(vao);

	// Pass in the canvas resolution so we can convert from
	// pixels to clipspace in the shader
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

	// Update the position buffer with rectangle positions
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
	// translation = [(gl.canvas.width - width)/2, (gl.canvas.height - height)/2];
	setObject(gl, translation[0], translation[1], width, height);

	// Set a random color.
	gl.uniform4fv(colorLocation, colorObject);

	// Draw the rectangle.
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	gl.drawArrays(primitiveType, offset, count);
}

// Fill the buffer with the values that define a rectangle.
function setObject(gl, x, y, width, height) {
	let arrayArgs = [];
	switch (objectType) {
		// square
		case 's': {
			let x1 = x;
			let x2 = x + width;
			let y1 = y;
			let y2 = y + height;
			arrayArgs = [x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2];
			count = 6;
		}
		break;
		// triangle
		case 't': {
			let x1 = x;
			let x2 = x + width/2;
			let x3 = x + width;
			let y1 = y;
			let y2 = y + height;
			arrayArgs = [x1, y2, x2, y1, x3, y2];//, x1, y2, x2, y1, x3, y2];
			count = 3;
		}
		break;
		// diamond
		case 'd': {
			let x1 = x;
			let x2 = x + width/2;
			let x3 = x + width;
			let y1 = y;
			let y2 = y + height/2;
			let y3 = y + height;
			arrayArgs = [x1, y2, x2, y1, x2, y3, x2, y3, x2, y1, x3, y2];
			count = 6;
		}
		break;

	}

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayArgs), gl.STATIC_DRAW);
}

function switchObject (code) {
	// console.log(code);
	objectType = code;
	drawScene();
}
function switchColor(code) {
	// console.log(code);
	switch (code) {
		// vermelho
		case 'r':
			colorObject = [255,0,0,1];
		break;
		// verde
		case 'g':
			colorObject = [0,255,0,1];
		break;
		// azul
		case 'b':
			colorObject = [0,0,255,1];
		break;
		// ciano
		case 'c':
			colorObject = [0,255,255,1];
		break;
		// Magenta
		case 'm':
			colorObject = [255,0,255,1];
		break;
		// Amarelo
		case 'y':
			colorObject = [255,255,0,1];
		break;	
	}
	// evitar chamar o drawscene sem necessidade e não repetir-lo tanto
	switch (code) {
		case 'r':
		case 'g':
		case 'b':
		case 'c':
		case 'm':
		case 'y':
			drawScene();
		break;
	}
}


function saveScreen() {
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

	requestAnimationFrame(saveScreen);
}