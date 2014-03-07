/**
 * 内核模块
 * @author: gonghao.gh
 * @date: 2013-11-26
 */

KISSY.add(function(S) {

	var Program = {

		getShader: function(gl, id) {
			var script = document.getElementById(id);
			if (!script) {
				return null;
			}

			var str = script.textContent;

			var shader;
			if (script.type == "x-shader/x-fragment") {
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			} else if (script.type == "x-shader/x-vertex") {
				shader = gl.createShader(gl.VERTEX_SHADER);
			} else {
				return null;
			}

			gl.shaderSource(shader, str);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				alert("Error! "+gl.getShaderInfoLog(shader));
				return null;
			}
			return shader;
		},

		load: function() {
			var gl = window.gl,
				fragmentShader = this.getShader(gl, "shader-fs"),
				vertexShader = this.getShader(gl, "shader-vs");

			prg = gl.createProgram();
			gl.attachShader(prg, vertexShader);
			gl.attachShader(prg, fragmentShader);
			gl.linkProgram(prg);

			if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
				alert("Error! Could not initialize shaders.");
				return;
			}

			gl.useProgram(prg);

			prg.aVertexPosition = gl.getAttribLocation(prg, "aVertexPosition");
			prg.aVertxNormal = gl.getAttribLocation(prg, "aVertxNormal");
			prg.aVertexColor = gl.getAttribLocation(prg, "aVertexColor");

			prg.uPMatrix = gl.getUniformLocation(prg, "uPMatrix");
			prg.uMVMatrix = gl.getUniformLocation(prg, "uMVMatrix");
			prg.uNMatrix = gl.getUniformLocation(prg, "uNMatrix");

			prg.uMaterialDiffuse = gl.getUniformLocation(prg, "uMaterialDiffuse");
			prg.uMaterialAmbient = gl.getUniformLocation(prg, "uMaterialAmbient");
			prg.uMaterialSpecular = gl.getUniformLocation(prg, "uMaterialSpecular");
			prg.uLightAmbient = gl.getUniformLocation(prg, "uLightAmbient");
			prg.uLightDiffuse = gl.getUniformLocation(prg, "uLightDiffuse");
			prg.uLightSpecular = gl.getUniformLocation(prg, "uLightSpecular");
			prg.uLightPosition = gl.getUniformLocation(prg, "uLightPosition");
			prg.uShininess = gl.getUniformLocation(prg, "uShininess");
			prg.uUpdateLight      = gl.getUniformLocation(prg, "uUpdateLight");
     		prg.uWireframe        = gl.getUniformLocation(prg, "uWireframe");
     		prg.uPerVertexColor   = gl.getUniformLocation(prg, "uPerVertexColor");
			
			gl.uniform3fv(prg.uLightPosition, [0, 120, 120]);
		    gl.uniform4fv(prg.uLightAmbient, [0.20,0.20,0.20,1.0]);
		    gl.uniform4fv(prg.uLightDiffuse, [1.0,1.0,1.0,1.0]);
		    //gl.uniform4fv(prg.uLightSpecular, [1.0,1.0,1.0,1.0]);
		    //gl.uniform1f(prg.uShininess, 230.0);
		}
	};

	return Program;
});