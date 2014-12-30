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

        var useVertexColors = true,
            blending = true,
            depthTest = true,
            culling = false,
            lambert = true,
            floor = true,
            blendingEquation,
            blendingSource,
            blendingTarget,
            coneColor = "00FFFF",
            sphereColor = "B606AE",
            blendingColorHex = "80CD1A",
            blendingColor = [0.0, 1.0, 0.0],
            blendingAlpha = 1.0;

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
                gl.blendColor(blendingColor[0], blendingColor[1], blendingColor[2], blendingAlpha);

                // Disable culling
                gl.disable(gl.CULL_FACE);

                blendingEquation = gl.FUNC_ADD;
                blendingSource = gl.SRC_ALPHA;
                blendingTarget = gl.ONE_MINUS_SRC_ALPHA;

                var camera = new Camera({
                    type: CAMERA_ORBITING_TYPE
                });
                camera.goHome([0, 5, 35]);
                camera.setFocus([0.0, 0.0, 0.0]);
                camera.setAzimuth(25);
                camera.setElevation(-25);
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
                    "aVertexNormal"
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
                    "uUseVertexColor",
                    "uUseLambert"
                ];
                // set prg
                Program.load(attributeList, uniformList);

                gl.uniform4fv(prg.uLightAmbient, [1.0, 1.0, 1.0, 1.0]);
                gl.uniform3fv(prg.uLightPosition, [0, 5, 20]);
                gl.uniform4fv(prg.uLightDiffuse, [1.0, 1.0, 1.0, 1.0]);
                gl.uniform1i(prg.uUseVertexColor, useVertexColors);
                gl.uniform1i(prg.uUseLambert, lambert);
            },

            load: function() {
                Floor.build(80, 2);
                Scene.addObject(Floor);
                Scene.loadObject('models/geometry/cone.json', 'cone', {diffuse: [0, 1, 1, 1]});
                Scene.loadObject('models/geometry/sphere.json', 'sphere', {diffuse: [182/255, 6/255, 174/255, 1]});
            },

            draw: function() {
                gl.viewport(0, 0, width, height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                transforms.updatePerspective();

                try {
                    var objects = Scene.getObj();
                    for (var i = 0; i < objects.length; i++) {
                        var object = objects[i];

                        if (object.alias == 'floor' && !floor) {
                            continue;
                        }

                        transforms.calculateModelView();
                        // 放入栈中
                        transforms.push();

                        switch (object.alias) {
                            case 'cone':
                                mat4.translate(transforms.mvMatrix, [0, 0, -3.5]);
                                break;
                            case 'sphere':
                                mat4.scale(transforms.mvMatrix, [0.5, 0.5, 0.5]);
                                mat4.translate(transforms.mvMatrix, [0, 0, 3.5]);
                                break;
                        }

                        transforms.setMatrixUniforms();
                        // 从栈中取出缓存的MVMatrix
                        transforms.pop();

                        gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                        gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
                        gl.uniform1i(prg.uWireframe, object.wireframe);
                        gl.uniform1i(prg.uUseLambert, lambert);

                        gl.enableVertexAttribArray(prg.aVertexPosition);
                        gl.disableVertexAttribArray(prg.aVertexNormal);

                        gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                        gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(prg.aVertexPosition);

                        // 清除webgl中的warning
                        // @see also：http://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-this-has-significant-performance-penalt
                        gl.bindAttribLocation(prg, 0, 'a_Position');
                        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(0);

                        if(!object.wireframe) {
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

                function updateCulling(){
                    if(culling){
                        gl.enable(gl.CULL_FACE);
                    }
                    else {
                        gl.disable(gl.CULL_FACE);
                    }
                    app.refresh();
                }

                function updateAlphaSphere(alpha){
                    var sphere = Scene.getObject('sphere');
                    sphere.diffuse[3] = alpha;
                    self.draw();
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
                    if (func == "blending") {
                        blending = isChecked;
                        $("#selBlendEquation, #selSource, #selTarget").attr('disabled', isChecked ? "" : "disabled");
                        updateBlending();
                    } else if (func == "depth") {
                        depthTest = isChecked;
                        updateDepthTesting();
                    } else if (func == "backFace") {
                        culling = isChecked;
                        updateCulling();
                    } else if (func == "lambertTerm") {
                        lambert = isChecked;
                        app.refresh();
                    } else if (func == "floor") {
                        floor = isChecked;
                        app.refresh();
                    }
                });

                $("#selBlendEquation").on("change", function(event) {
                    blendingEquation = gl[event.target.value];
                    updateBlending();
                });

                $("#selSource").on("change", function(event) {
                    blendingSource = gl[event.target.value];
                    updateBlending();
                });

                $("#selTarget").on("change", function(event) {
                    blendingTarget = gl[event.target.value];
                    updateBlending();
                });

                $('#opt-sphere-first').on("click", function(){
                    Scene.renderSooner('sphere');
                    Scene.renderFirst('floor');
                    self.draw();
                });

                $('#opt-cone-first').on("click", function(){
                    Scene.renderSooner('cone');
                    Scene.renderFirst('floor');
                    self.draw();
                });

                $('#sliderSA').on('change', function(e) {
                    var $target = $(e.currentTarget),
                        alpha = +$target.val()/10;
                    $("#labelSA").text(alpha);
                    updateAlphaSphere(alpha);
                });

                $('#sliderCA').on('change', function(e) {
                    var $target = $(e.currentTarget),
                        alpha = +$target.val()/10;
                    $("#labelCA").text(alpha);
                    updateAlphaCone(alpha);
                });

                $('#sliderCOA').on('change', function(e) {
                    var $target = $(e.currentTarget),
                        alpha = +$target.val()/10;
                    $("#labelCOA").text(alpha);
                    updateAlphaCone(alpha);
                });
            }
        };

        main.init();
    });