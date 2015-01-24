/**
 * program
 * @author: gonghao.gh
 * @date: 2014-05-18
 */
KISSY.add("lib/program", function(S) {

    return {

        getShader: function(gl, id) {
            var script = document.getElementById(id);
            if (!script) {
                return null;
            }

            var str = "",
                k = script.firstChild;
            while(k) {
                if (k.nodeType == 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }

            var shader;
            if (script.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else if (script.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        },

        load: function(attributeList, uniformList) {
            var vertexShader = this.getShader(gl, "shader-vs");
            var fragmentShader = this.getShader(gl, "shader-fs");

            prg = gl.createProgram();
            gl.attachShader(prg, vertexShader);
            gl.attachShader(prg, fragmentShader);
            gl.linkProgram(prg);

            if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
                alert("Could not initialize shaders");
            }
            gl.useProgram(prg);

            this.setAttributeLocations(attributeList);
            this.setUniformLocations(uniformList);
        },

        setAttributeLocations: function(attrList) {

            for (var i = 0, max = attrList.length; i < max; i++) {
                prg[attrList[i]] = gl.getAttribLocation(prg, attrList[i]);
            }
        },

        setUniformLocations: function (uniformList){

            for(var i = 0, max = uniformList.length; i < max; i++) {
                prg[uniformList[i]] = gl.getUniformLocation(prg, uniformList[i]);
            }
        }
    };

}, {
    requires: []
});