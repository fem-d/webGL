/**
 *
 */
KISSY.use('node, lib/webGLApp, lib/program, lib/camera, lib/cameraInteractor, lib/scene, lib/picker, lib/sceneTransforms, lib/floor, lib/axis',
    function(S, Node, WebGLApp, Program, Camera, CameraInteractor, Scene, Picker, SceneTransforms, Floor, Axis) {

    var $ = Node.all;
    var app;

    var interactor,
        transforms,
        picker,
        showPickingImage = false;

    var CAMERA_ORBITING_TYPE = 1,
        CAMERA_TRACKING_TYPE = 2;

    var main = {

        init: function() {
            app = new WebGLApp({
                "canvasId": "canvas-element-id"
            });

            this.colorset = {};
            app.configureGLHook = this.configure.bind(this);
            app.loadSceneHook = this.load.bind(this);
            app.drawSceneHook = this.render.bind(this);
            app.run();

            this.bindEvent();
        },

        configure: function() {
            gl.clearColor(0.3, 0.3, 0.3, 1.0);
            gl.clearDepth(100.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            var camera = new Camera({
                type: CAMERA_ORBITING_TYPE
            });
            camera.goHome([0, 0, 192]);
            camera.setFocus([0.0, 0.0, 0.0]);
            camera.setAzimuth(37);
            camera.setElevation(-22);
            camera.hookRenderer = this.render.bind(this);
            this.camera = camera;

            picker = new Picker({
                canvas: document.getElementById("canvas-element-id"),
                scene: Scene,
                draw: this.draw.bind(this)
            });

            picker.processHitsCallback = this.processHits.bind(this);
            picker.addHitCallback = this.addHit.bind(this);
            picker.removeHitCallback = this.removeHit.bind(this);
            picker.hitPropertyCallback = this.hitProperty.bind(this);
            picker.moveCallback = this.movePickedObjects.bind(this);

            interactor = new CameraInteractor({
                camera: camera,
                canvas: document.getElementById("canvas-element-id")
            });
            interactor.setPicker(picker);

            transforms = new SceneTransforms({
                camera: camera
            });
            transforms.startup();

            // for program
            var attributeList = [
                "aVertexPosition",
                "aVertexNormal",
                "aVertexColor",
                "aVertexTextureCoords"
            ];
            var uniformList = [
                "uPMatrix",
                "uMVMatrix",
                "uNMatrix",
                "uMaterialDiffuse",
                "uMaterialAmbient",
                "uLightAmbient",
                "uLightDiffuse",
                "uLightPosition",
                "uWireframe",
                "uAlpha",
                "uUseVertexColor",
                "uOffscreen",
                "uSampler",
                "uUseTextures",
                "uPickingColor"
            ];
            // set prg
            Program.load(attributeList, uniformList);

            gl.uniform3fv(prg.uLightPosition, [0, 5, 20]);
            gl.uniform4fv(prg.uLightAmbient, [0.0, 0.0, 0.0, 1.0]);
            gl.uniform4fv(prg.uLightDiffuse, [1.0, 1.0, 1.0, 1.0]);
            gl.uniform1f(prg.uAlpha, 1.0);
        },

        positionGenerator: function() {
            var x = Math.floor(Math.random() * 60);
            var y = 0;
            var z = Math.floor(Math.random() * 60);
            var flagX = Math.floor(Math.random() * 10);
            var flagZ = Math.floor(Math.random() * 10);

            if (flagX >= 5) {
                x = -x;
            }
            if (flagZ >= 5) {
                z = -z;
            }
            return [x, y, z];
        },

        uniqueColorGenerator: function(key) {
            return key + "_" + (+new Date());
        },

        objectLabelGenerator: function() {
            var color = [Math.random(), Math.random(), Math.random(), 1.0];
            var key = color[0] + ':' + color[1] + ':' + color[2];
            var colorset = this.colorset;

            if (key in colorset) {
                return this.uniqueColorGenerator(key);
            } else {
                colorset[key] = true;
                return color;
            }
        },

        diffuseColorGenerator: function(i) {
            var c = (i % 30 / 60) + 0.3;
            return [c, c, c, 1];
        },

        scaleGenerator: function() {
            var f = Math.random() + 0.3;
            return [f, f, f];
        },

        load: function() {
            Floor.build(80,5);
            Floor.pcolor = [0.0, 0.0, 0.0, 1.0];
            Scene.addObject(Floor);

            var positionValue, scaleFactor, objectLabel, objectType, diffuseColor;

            for (var i = 0; i < 100; i++) {
                positionValue = this.positionGenerator();
                objectLabel = this.objectLabelGenerator();
                scaleFactor = this.scaleGenerator();
                diffuseColor = this.diffuseColorGenerator(i);
                objectType = Math.floor(Math.random()*2);

                switch (objectType){
                    case 1: Scene.loadObject('models/geometry/sphere.json',   'ball_'+i,     {position:positionValue,scale:scaleFactor, diffuse:diffuseColor, pcolor:objectLabel}); break;
                    case 0: Scene.loadObject('models/geometry/cylinder.json', 'cylinder_'+i, {position:positionValue,scale:scaleFactor, diffuse:diffuseColor, pcolor:objectLabel}); break;
                }
            }
        },

        draw: function() {
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            transforms.updatePerspective();

            //try {
            debugger;
                var offscreen = Program.getUniform(prg.uOffscreen);
                var objects = Scene.getObj();
                for (var i = 0; i < objects.length; i++) {
                    var object = objects[i];

                    if (object.alias == 'floor' && (showPickingImage || offscreen)){
                        continue;
                    }

                    if (object.diffuse[3] < 1.0 && !offscreen) {
                        gl.disable(gl.DEPTH_TEST);
                        gl.enable(gl.BLEND);
                    } else {
                        gl.enable(gl.DEPTH_TEST);
                        gl.disable(gl.BLEND);
                    }

                    transforms.calculateModelView();
                    // 放入栈中
                    transforms.push();
                    if (object.alias != 'floor'){
                        mat4.translate(transforms.mvMatrix, object.position);
                        mat4.scale(transforms.mvMatrix, object.scale);
                    }
                    transforms.setMatrixUniforms();
                    // 从栈中取出缓存的MVMatrix
                    transforms.pop();

                    gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                    gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
                    gl.uniform4fv(prg.uPickingColor, object.pcolor);
                    gl.uniform1i(prg.uWireframe, object.wireframe);
                    gl.uniform1i(prg.uUseVertexColor, false);
                    gl.uniform1i(prg.uUseTextures, false);

                    gl.enableVertexAttribArray(prg.aVertexPosition);
                    gl.disableVertexAttribArray(prg.aVertexNormal);
                    gl.disableVertexAttribArray(prg.aVertexColor);
                    gl.disableVertexAttribArray(prg.aVertexTextureCoords);

                    gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                    gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(prg.aVertexPosition);

                    if(!offscreen && !showPickingImage){
                        if (object.scalars != null){
                            gl.enableVertexAttribArray(prg.aVertexColor);
                            gl.uniform1i(prg.uUseVertexColor, true);
                            gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
                            gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
                        }

                        if (object.texture_coords) {
                            gl.enableVertexAttribArray(prg.aVertexTextureCoords);
                            gl.uniform1i(prg.uUseTextures, true);
                            gl.bindBuffer(gl.ARRAY_BUFFER, object.tbo);
                            gl.vertexAttribPointer(prg.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

                            gl.activeTexture(gl.TEXTURE0);
                            gl.bindTexture(gl.TEXTURE_2D, object.texture.tex);
                            gl.uniform1i(prg.uSampler, 0);
                        }
                    } else {
                        gl.uniform1i(prg.uUseTextures, false);
                        gl.uniform1i(prg.uUseVertexColors, false);
                    }

                    // 清除webgl中的warning
                    // @see also：http://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-this-has-significant-performance-penalt
                    //gl.bindAttribLocation(prg, 0, 'a_Position');
                    //gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                    //gl.enableVertexAttribArray(0);

                    if(!object.wireframe){
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
                        gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(prg.aVertexNormal);
                    }
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

                    if (object.wireframe) {
                        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                    } else {
                        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                    }

                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }
            //} catch(err) {
            //    console.error(err.message);
            //}
        },

        render: function() {
            debugger;
            gl.bindFramebuffer(gl.FRAMEBUFFER, picker.getFramebuffer());
            gl.uniform1i(prg.uOffscreen, true);
            this.draw();

            gl.uniform1i(prg.uOffscreen, showPickingImage);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.draw();
        },

        hitProperty: function(ob) {
            return ob.pcolor;
        },

        addHit: function(ob) {
            ob.previous = ob.diffuse.slice(0);
            ob.diffuse = ob.pcolor;
            this.render();
        },

        removeHit: function(ob) {
            ob.diffuse = ob.previous.slice(0);
            this.render();
        },

        processHits: function(hits) {
            var names = '', ob;
            for(var i = 0; i < hits.length; i++) {
                ob = hits[i];
                ob.diffuse = ob.previous;
                names += ob.alias + ' ';
            }
            this.render();
            $('#selected-id').html('You picked : ' + names);
        },

        movePickedObjects: function(hits, interactor, dx, dy) {
            if (hits == 0) {
                return;
            }

            var camera = interactor.camera;
            var depth = interactor.alt;
            var factor = Math.max(Math.max(camera.position[0], camera.position[1]), camera.position[2]) / 1000;
            var scaleX, scaleY;
            for (var i = 0, max = hits.length; i < max; i++) {
                scaleX = vec3.create();
                scaleY = vec3.create();

                if (depth) {
                    vec3.scale(camera.normal, dy * factor, scaleY);
                } else {
                    vec3.scale(camera.up, -dy * factor, scaleY);
                    vec3.scale(camera.right, dx * factor, scaleX);
                }

                vec3.add(hits[i].position, scaleY);
                vec3.add(hits[i].position, scaleX);
            }
            this.render();
        },

        // Options
        bindEvent: function() {

            var self = this;
            $('#show-picking-btn').on("click", function(e) {
                showPickingImage = !showPickingImage;
            });
        }
    };

    main.init();
});