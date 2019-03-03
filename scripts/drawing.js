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

function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	var body = document.getElementsByTagName("BODY")[0]; 
	var canvas = document.querySelector("#glCanvas");
	var gl = canvas.getContext("webgl2");
		if (!gl) {
		return;
	}

	// Use our boilerplate utils to compile the shaders and link into a program
	var program = webglUtils.createProgramFromSources(gl,[vertexShaderSource, fragmentShaderSource]);

	// look up where the vertex data needs to go.
	var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

	// look up uniform locations
	var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	var colorLocation = gl.getUniformLocation(program, "u_color");

	// Create a buffer
	var positionBuffer = gl.createBuffer();

	// Create a vertex array object (attribute state)
	var vao = gl.createVertexArray();

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

	// First let's make some variables
	// to hold the translation, width and height of the rectangle
	var translation = [0,0];
	var width = 100;
	var height = 100;
	var colorSquare = randomColor();// [Math.random(), Math.random(), Math.random(), 1];
	var colorCanvas = [255,255,255,1];

	drawScene();

	function drawScene() {
		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// Clear the canvas
		gl.clearColor(colorCanvas[0],colorCanvas[1],colorCanvas[2],colorCanvas[3]);
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
			
		translation = [(gl.canvas.width - width)/2, (gl.canvas.height - height)/2];
		setRectangle(gl, translation[0], translation[1], width, height);

		// Set a random color.
		gl.uniform4fv(colorLocation, colorSquare);

		// Draw the rectangle.
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		gl.drawArrays(primitiveType, offset, count);
	}
  	
	// assign events
	// usei para fins de redimensionamento da página
	body.onresize = function() {
		drawScene();
	};
	// esse evento não funciona no canvas, tive que usar o body
	body.onkeypress = function(ev) {
		// console.log(ev.code);
		// uso a propriedade code para não haver distinção entre maiúsculas e minúsculas
		switch (ev.code) {
			// vermelho
			case 'KeyR':
				colorSquare = [255,0,0,1];
			break;
			// verde
			case 'KeyG':
				colorSquare = [0,255,0,1];
			break;
			// azul
			case 'KeyB':
				colorSquare = [0,0,255,1];
			break;
			// ciano
			case 'KeyC':
				colorSquare = [0,255,255,1];
			break;
			// Magenta
			case 'KeyM':
				colorSquare = [255,0,255,1];
			break;
			// Amarelo
			case 'KeyY':
				colorSquare = [255,255,0,1];
			break;	
		}
		// evitar chamar o drawscene sem necessidade e não repetir-lo tanto
		switch (ev.code) {
			case 'KeyR':
			case 'KeyG':
			case 'KeyB':
			case 'KeyC':
			case 'KeyM':
			case 'KeyY':
				drawScene();
			break;
		}
	};
	canvas.onclick = function() {
		// console.log("Left Click");
		colorCanvas = randomColor();
		drawScene();
	};
	canvas.oncontextmenu = function(ev) {
		// console.log("Right Click");
		// evita aparecer o menu de contexto
		ev.preventDefault();
		colorSquare = randomColor();
		drawScene();
	};
	
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	 x1, y1,
	 x2, y1,
	 x1, y2,
	 x1, y2,
	 x2, y1,
	 x2, y2,
	]), gl.STATIC_DRAW);
}

function randomColor(arg) {
	return [Math.random(), Math.random(), Math.random(), 1];
}