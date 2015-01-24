/**
 *  ex6-2
 */
KISSY.use('node, lib/webGLApp, lib/program, lib/camera, lib/cameraInteractor, lib/scene, lib/sceneTransforms, lib/light, lib/lights, lib/floor, lib/axis',
    function(S, Node, WebGLApp, Program, Camera, CameraInteractor, Scene, SceneTransforms, Light, Lights, Floor, Axis) {

        var $ = Node.all;
        var app;

        var interactor,
            transforms;

        var CAMERA_ORBITING_TYPE = 1;
        var CAMERA_TRACKING_TYPE = 2;

        var main = {

            init: function() {
                app = new WebGLApp({
                    "canvasId": "canvas-element-id"
                });

                app.configureGLHook = this.configure;
                app.loadSceneHook = this.load;
                app.drawSceneHook = this.draw;
                app.run();
                this.bindEvent();
            },

            configure: function() {
                gl.clearColor(0.3, 0.3, 0.3, 1.0);
                gl.clearDepth(1.0);

                // Enable depth testing
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LESS);

                // Enable blending
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

                // Disable culling
//                gl.enable(gl.CULL_FACE);

                var camera = new Camera({
                    type: CAMERA_ORBITING_TYPE
                });
                camera.goHome([0, 5, 35]);
                camera.setFocus([0.0, 0.0, 0.0]);
                camera.setAzimuth(-47);
                camera.setElevation(-3);
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

                // for program
                var attributeList = [
                    "aVertexPosition",
                    "aVertexNormal",
                    "aVertexColor"
                ];
                var uniformList = [
                    "uPMatrix",
                    "uMVMatrix",
                    "uNMatrix",
                    "uMaterialDiffuse",
                    "uMaterialAmbient",
                    "uMaterialSpecular",
                    "uLightAmbient",
                    "uLightDiffuse",
                    "uPositionLight",
                    "uWireframe"
                ];
                // set prg
                Program.load(attributeList, uniformList);

                gl.uniform4fv(prg.uLightAmbient, [1.0, 1.0, 1.0, 1.0]);
                gl.uniform3fv(prg.uPositionLight, [0, 7, 3]);
                gl.uniform4fv(prg.uLightDiffuse, [1.0, 1.0, 1.0, 1.0]);
            },

            load: function() {
                Floor.build(80, 2);
                Scene.addObject(Floor);
                Scene.loadObject('models/geometry/cone.json','cone');
                Scene.loadObject('models/geometry/wall.json','wall',{diffuse:[0.5,0.5,0.2,1.0], ambient:[0.2,0.2,0.2,1.0]});
            },

            draw: function() {
                gl.viewport(0, 0, width, height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                transforms.updatePerspective();

                try {
                    var objects = Scene.getObj();
                    for (var i = 0; i < objects.length; i++) {
                        var object = objects[i];

                        transforms.calculateModelView();
                        // 放入栈中
                        transforms.push();

                        switch (object.alias) {
                            case 'cone':
                                mat4.translate(transforms.mvMatrix, [0, 0, -5]);
                                break;
                            case 'wall':
                                mat4.translate(transforms.mvMatrix, [0, 0, 5]);
                                break;
                        }

                        transforms.setMatrixUniforms();
                        // 从栈中取出缓存的MVMatrix
                        transforms.pop();

                        gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                        gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
                        gl.uniform1i(prg.uWireframe, object.wireframe);

                        gl.enableVertexAttribArray(prg.aVertexPosition);
                        gl.disableVertexAttribArray(prg.aVertexNormal);
                        gl.disableVertexAttribArray(prg.aVertexColor);

                        gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                        gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(prg.aVertexPosition);

                        // 清除webgl中的warning
                        // @see also：http://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-this-has-significant-performance-penalt
                        gl.bindAttribLocation(prg, 0, 'a_Position');
                        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(0);

                        if (!object.wireframe) {
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
                } catch(err) {
                    console.error(err.message);
                }
            },

            bindEvent: function() {
                var self = this;

                function updateBlending() {
                    if (blending){
                        gl.enable(gl.BLEND);
                    }
                    else{
                        gl.disable(gl.BLEND);
                    }

                    gl.blendFunc(blendingSource, blendingTarget);
                    gl.blendEquation(blendingEquation);
                    gl.blendColor(blendingColor[0], blendingColor[1], blendingColor[2],blendingAlpha);
                    app.refresh();
                }

                function updateDepthTesting() {
                    if(depthTest){
                        gl.enable(gl.DEPTH_TEST);
                    }
                    else {
                        gl.disable(gl.DEPTH_TEST);
                    }
                    app.refresh();
                }

                function updateAlphaCone(alpha){
                    var cone = Scene.getObject('cone');
                    cone.diffuse[3] = alpha;
                    self.draw();
                }

                function updateConstantAlpha(alpha){
                    blendingAlpha = alpha;
                    updateBlending();
                }

                $(".funcCon").delegate("click", 'input', function(e) {
                    var $target = $(e.currentTarget),
                        func = $target.closest("label").attr("data-type"),
                        isChecked = $target[0].checked;
                    if (func == "cone-first") {
                        Scene.renderSooner('cone');
                        Scene.renderFirst('floor');
                        self.draw();
                    } else if (func == "wall-first") {
                        Scene.renderSooner('wall');
                        Scene.renderFirst('floor');
                        self.draw();
                    }
                });

                $('#sliderA').on('change', function(e) {
                    var $target = $(e.currentTarget),
                        alpha = +$target.val()/10;
                    $("#labelA").text(alpha);
                    var wall = Scene.getObject('wall');
                    wall.diffuse[3] = alpha;
                    self.draw();
                });

                $('#sliderB').on('change', function(e) {
                    var $target = $(e.currentTarget),
                        alpha = +$target.val()/10;
                    $("#labelB").text(alpha);
                    var cone = Scene.getObject('cone');
                    cone.diffuse[3] = alpha;
                    self.draw();
                });
            }
        };

        main.init();
    });