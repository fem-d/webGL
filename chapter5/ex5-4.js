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

    var sceneTime = 0.0;

    var animationRate = 15; /* 15ms */
    var elapsedTime = undefined;
    var initialTime = undefined;

    var updateLightPosition = false;

    var INITIAL_POSITION = [-25, 0, 20];
    var FINAL_POSITION = [40, 0, -20];
    var ISTEPS = 1000;
    var position = [];

    // 辅助函数
    function interpolate() {

        var X0 = INITIAL_POSITION[0],
            Y0 = INITIAL_POSITION[1],
            Z0 = INITIAL_POSITION[2];

        var X1 = FINAL_POSITION[0],
            Y1 = FINAL_POSITION[1],
            Z1 = FINAL_POSITION[2];

        var dx = (X1 - X0)/ISTEPS,
            dy = (Y1 - Y0)/ISTEPS,
            dz = (Z1 - Z0)/ISTEPS;

        for (var i = 0; i < ISTEPS; i++) {
            position.push([X0+(dx*i), Y0+(dy*i), Z0+(dz*i)]);
        }

    }

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
            camera.goHome([0, 2, 80]);
            camera.setElevation(-20);
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
            Scene.addObject(floor);
            Scene.loadObject('models/geometry/ball.json','ball');
            Scene.loadObject('models/geometry/flag.json','flagInicio');
            Scene.loadObject('models/geometry/flag.json','flagFin');
            interpolate();
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
                    transforms.push();
                    if (object.alias == 'ball') {
                        mat4.translate(transforms.mvMatrix, position[sceneTime]);
                        object.diffuse = [0.5, 0.9, 0.3, 1.0];
                    } else if (object.alias == 'flagInicio') {
                        mat4.translate(transforms.mvMatrix, INITIAL_POSITION);
                        object.diffuse = [0.1, 0.3, 0.9, 1.0];
                    } else if (object.alias == 'flagFin') {
                        mat4.translate(transforms.mvMatrix, FINAL_POSITION);
                        object.diffuse = [0.9, 0.3, 0.1, 1.0];
                    }
                    transforms.setMatrixUniforms();
                    transforms.pop();

                    gl.uniform1i(prg.uTranslate, false);

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
                console.log(err);
            }
        },

        animate: function() {
            sceneTime += 1;
            if (sceneTime == ISTEPS) {
                sceneTime = 0;
            }
            this.draw();
        },

        startAnimation: function() {

            setInterval(this.animate.bind(this), 30/1000);
        }
    };

    main.init();
});