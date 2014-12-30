/**
 * scene
 * @author: gonghao.gh
 * @date: 2014-05-18
 */
KISSY.add("lib/scene", function(S, Node, Base, Utils) {

    var objects = [];

    return {

        loadObject: function(filename, alias, attributes) {
            var self = this,
                request = new XMLHttpRequest();
            request.open("GET", filename);

            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if (request.status == 404) {
                        console.error(filename + ' does not exist');
                    } else {
                        var o = JSON.parse(request.responseText);
                        o.alias = alias ? alias : "none";
                        o.remote = true;
                        self.addObject(o, attributes);
                    }
                }
            }
            request.send();
        },

        loadObjectByParts: function(path, alias, parts) {
            for (var i = 1; i <= parts; i++) {
                var partFilename = path + "" + i + ".json";
                var partAlias = alias + "" + i;
                this.loadObject(partFilename, partAlias);
            }
        },

        getObject: function(alias) {
            for (var i = 0; i < objects.length; i++) {
                if (alias == objects[i].alias) {
                    return objects[i];
                }
            }
            return null;
        },

        addObject: function(object, attributes) {

            object.wireframe = object.wireframe ? object.wireframe : false;
            object.diffuse = object.diffuse ? object.diffuse : [1.0, 1.0, 1.0, 1.0];
            object.ambient = object.ambient ? object.ambient : [0.1, 0.1, 0.1, 1.0];
            object.specular = object.specular ? object.specular : [1.0, 1.0, 1.0, 1.0];

            for (var key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    object[key] = attributes[key];
                }
            }

            var vertexBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);

            var normalBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Utils.calculateNormals(object.vertices, object.indices)), gl.STATIC_DRAW);

            var colorBufferObject;
            if (object.scalars) {
                colorBufferObject = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferObject);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.scalars), gl.STATIC_DRAW);
                object.cbo = colorBufferObject;
            }

            var indexBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);

            object.vbo = vertexBufferObject;
            object.nbo = normalBufferObject;
            object.ibo = indexBufferObject;

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            objects.push(object);

            if (object.remote) {
                console.info(object.alias + ' has been added to the scene [Remote]');
            } else {
                console.info(object.alias + ' has been added to the scene [Local]');
            }
        },

        getObj: function() {
            return objects;
        },

        removeObject: function(objectName) {
            var o = this.getObject(objectName);
            var idx = objects.indexOf(o);
            objects.splice(idx, 1);
        },

        renderFirst: function(objectName) {
            var o = this.getObject(objectName),
                idx = objects.indexOf(o);

            if (idx == 0) {
                return;
            }
            objects.splice(idx, 1);
            objects.splice(0, 0, o);
            console.info('render order:' + this.renderOrder());
        },

        renderLast: function(objectName) {
            var o = this.getObject(objectName),
                idx = objects.indexOf(o);

            if (idx == 0) {
                return;
            }
            objects.splice(idx, 1);
            objects.push(0);
            console.info('render order:' + this.renderOrder());
        },

        // 提前一位
        renderSooner: function(objectName) {
            var o = this.getObject(objectName),
                idx = objects.indexOf(o);

            if (idx == 0) {
                return;
            }
            objects.splice(idx, 1);
            objects.splice(idx - 1, 0, o);
            console.info('render order:' + this.renderOrder());
        },

        renderLater: function(objectName) {
            var o = this.getObject(objectName),
                idx = objects.indexOf(o);

            if (idx == objects.length - 1) {
                return;
            }
            objects.splice(idx, 1);
            objects.splice(idx + 1, 0, o);
            console.info('render order:' + this.renderOrder());
        },

        renderOrder: function() {
            var s = '[ ';
            for(var i = 0, max = objects.length; i < max; i++) {
                s += objects[i].alias + ' ';
            }
            s += ']';
            return s;
        }
    };

}, {
    requires: [
        'node',
        'base',
        'lib/utils'
    ]
});