/**
 * 场景模块
 * @author: gonghao.gh
 * @date: 2013-11-26
 */
KISSY.add(function(S, IO, Utils) {

    var n = 0;

	var Scene = {

		objects: [],

		getObject: function(alias) {
			for (var i = 0, l = this.objectes.length; i < l; i++) {
				if (alias == this.objects[i].alias) {
					return this.objects[i];
				}
			}
		},

		loadObject: function(filename, alias, attributes) {
			var self = this;
			IO.get(
				filename,
				{},
				function(res) {
					res.alias = alias ? alias : "none";
					res.remote = true;
					self.addObject(res, attributes);	
				},
				"json"
			);
		},

		loadObjectsByParts: function(path, alias, parts) {
			for (var i = 1; i < parts; i++) {
				var partFilename = path + "" + i + ".json",
					partAlias = alias + "" + i;
				this.loadObject(partFilename, partAlias);
			}
		},

		addObject: function(object, attributes) {
			if (object.perVertexColor === undefined) { object.perVertexColor = false; }
			if (object.wireframe === undefined) { object.wireframe = false; }
			if (object.diffuse === undefined) { object.diffuse = [1.0, 1.0, 1.0, 1.0]; }
			if (object.ambient === undefined) { object.ambient = [0.1, 0.1, 0.1, 1.0]; }
			if (object.specular === undefined) { object.specular = [1.0, 1.0, 1.0, 1.0]; }

			for (var key in attributes) {
				if (object.hasOwnProperty(key)) {
					object[key] = attributes[key];
				}
			}

			var vertexBufferObject = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);

			var normalBufferObjcet = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObjcet);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Utils.calculateNormals(object.vertices, object.indices)), gl.STATIC_DRAW);

			var colorBufferObject;
			if (object.perVertexColor) {
				colorBufferObject = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferObject);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.colors), gl.STATIC_DRAW);
			    object.cbo = colorBufferObject;
            }

			var indexBufferObject = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);

			object.vbo = vertexBufferObject;
			object.ibo = indexBufferObject;
			object.nbo = normalBufferObjcet;

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			this.objects.push(object);

			if (object.remote) {
	        	console.info(object.alias + ' has been added to the scene [Remote]');
	        } else {
	            console.info(object.alias + ' has been added to the scene [Local]');
	        }
		}
	};

	return Scene;
}, {
    requires: [
        'io',
        'lib/utils'
    ]
});