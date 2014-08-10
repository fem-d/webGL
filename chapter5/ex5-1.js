/**
 *
 */
KISSY.use('node, lib/webGLApp, lib/camera, lib/cameraInteractor, lib/scene, lib/sceneTransforms, lib/floor, lib/axis',
    function(S, Node, WebGLApp, Camera, CameraInteractor, Scene, SceneTransforms, Floor, Axis) {

    var $ = Node.all;
    var app;

    var interactor,
        transforms;

    var CAMERA_ORBITING_TYPE = 1,
        CAMERA_TRACKING_TYPE = 2;

    // local transformation variables
    var dx_sphere = 0.1,
        dx_cone = 0.15,
        pos_sphere = 0,
        pos_cone = 0;

    var frequency = 5,
        initialTime,
        elapsedTime;

    var updateLightPosition = false;

    var main = {

        init: function() {
            app = new WebGLApp({
                "canvasId": "canvas-element-id"
            });

            app.configureGLHook = this.configure;
            app.loadSceneHook = this.load;
            app.drawSceneHook = this.draw;
            app.run();

            // begin local transformations
            this.startAnimation();
        },

        configure: function() {
            gl.clearColor(0.3, 0.3, 0.3, 1.0);
            gl.clearDepth(100.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            var camera = new Camera({
                type: CAMERA_ORBITING_TYPE
            });
            camera.goHome([0, 2, 50]);
            camera.setFocus([0.0, 0.0, 0.0]);
            camera.hookRenderer = this.draw;
            this.camera = camera;

            interactor = new CameraInteractor({
                camera: camera,
                canvas: document.getElementById("canvas-element-id")
            });

            transforms = new SceneTransforms({
                camera: camera
            });
            transforms.startup();
        },

        load: function() {
            var floor = Floor.build(80, 2);
            var axis = Axis.build(82);
            Scene.addObject(floor);
            Scene.addObject(axis);
            Scene.loadObject("models/geometry/sphere.json", "sphere");
            Scene.loadObject("models/geometry/cone.json", "cone");
        },

        draw: function() {
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            transforms.updatePerspective();

            try {
                gl.uniform1i(prg.uUpdateLight, updateLightPosition);

                var objects = Scene.getObj();
                for (var i = 0; i < objects.length; i++) {
                    var object = objects[i];

                    transforms.calculateModelView();
                    // 放入栈中
                    transforms.push();
                    if (object.alias == "sphere") {
                        var sphereTransform = transforms.mvMatrix;
                        mat4.translate(sphereTransform, [0, 0, pos_sphere]);
                    } else if (object.alias == "cone") {
                        var coneTransform = transforms.mvMatrix;
                        mat4.translate(coneTransform, [0, pos_cone, 0]);
                    }
                    transforms.setMatrixUniforms();
                    // 从栈中取出缓存的MVMatrix
                    transforms.pop();

                    gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                    gl.uniform4fv(prg.uMaterialSpecular, object.specular);
                    gl.uniform4fv(prg.uMaterialAmbient, object.ambient);

                    gl.uniform1i(prg.uWireframe, object.wireframe);
                    gl.uniform1i(prg.uPerVertexColor, object.perVertexColor);

                    gl.enableVertexAttribArray(prg.aVertexPosition);
                    gl.disableVertexAttribArray(prg.aVertexNormal);
                    gl.disableVertexAttribArray(prg.aVertexColor);

                    gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                    gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(prg.aVertexPosition);

                    if (!object.wireframe) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
                        gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(prg.aVertexNormal);
                    }

                    if (object.perVertexColor) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
                        gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(prg.aVertexColor);
                    }

                    // 清除webgl中的warning
                    // @see also：http://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-this-has-significant-performance-penalt
                    gl.bindAttribLocation(prg, 0, 'a_Position');
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(0);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

                    if (object.wireframe) {
                        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                    } else {
                        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }
            } catch(err) {
                console.error(err.message);
            }
        },

        animate: function() {
            pos_sphere += dx_sphere;
            if (pos_sphere >= 30 || pos_sphere <= -30) {
                dx_sphere = -dx_sphere;
            }

            pos_cone += dx_cone;
            if (pos_cone >= 35 || pos_cone <= -35) {
                dx_cone = -dx_cone;
            }
            this.draw();
        },

        onFrame: function() {
            elapsedTime = +new Date() - initialTime;
            if (elapsedTime < frequency) {
                return;
            }

            var steps = Math.floor(elapsedTime / frequency);
            while (steps) {
                this.animate();
                steps -= 1;
            }
            initialTime = +new Date();
        },

        startAnimation: function() {
            var self = this;
            initialTime = +new Date();
            setInterval(self.onFrame.bind(self), frequency/1000);
        }
    };

    main.init();
});