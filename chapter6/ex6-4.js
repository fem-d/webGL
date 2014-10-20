/**
 *  ex6-2
 */
KISSY.use('node, lib/webGLApp, lib/program, lib/camera, lib/cameraInteractor, lib/scene, lib/sceneTransforms, lib/light, lib/lights, lib/floor, lib/axis',
    function(S, Node, WebGLApp, Program, Camera, CameraInteractor, Scene, SceneTransforms, Light, Lights, Floor, Axis) {

        var $ = Node.all;
        var app;

        var interactor,
            transforms;

        var CAMERA_ORBITING_TYPE = 1,
            CAMERA_TRACKING_TYPE = 2;

        var main = {

            init: function() {
                app = new WebGLApp({
                    "canvasId": "canvas-element-id"
                });

                app.configureGLHook = this.configure;
                app.loadSceneHook = this.load;
                app.drawSceneHook = this.draw;
                app.run();
            },

            configure: function() {
                gl.clearColor(0.3, 0.3, 0.3, 1.0);
                gl.clearDepth(1.0);
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);


                var camera = new Camera({
                    type: CAMERA_ORBITING_TYPE
                });
                camera.goHome([0, 5, 30]);
                camera.setFocus([0.0, 0.0, 0.0]);
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

                // init lights
                var red = new Light({name: "red"});
                red.setPosition([0, 7, 3]);
                red.setDiffuse([1.0, 0.0, 0.0, 1.0]);
                red.setProperty('direction', [0, -2, -0.1]);

                var green = new Light({name: "green"});
                green.setPosition([4, 3, 3]);
                green.setPosition([4, 3, 3]);
                green.setDiffuse([0.0, 1.0, 0.0, 1.0]);
                green.setProperty('direction', [-0.5, 1, -0.1]);

                var blue = new Light({name: "blue"});
                blue.setPosition([-4, 3, 3]);
                blue.setDiffuse([0.0, 0.0, 1.0, 1.0]);
                blue.setProperty('direction', [0.5, 1, -0.1]);

                Lights.add(red);
                Lights.add(green);
                Lights.add(blue);

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
                    "uLightDirection",
                    "uWireframe",
                    "uLightSource",
                    "uCutOff"
                ];
                // set prg
                Program.load(attributeList, uniformList);

                gl.uniform1f(prg.uCutOff, 0.55);
                gl.uniform4fv(prg.uLightAmbient, [1.0, 1.0, 1.0, 1.0]);
                gl.uniform3fv(prg.uLightPosition, Lights.getArray('position'));
                gl.uniform4fv(prg.uLightDiffuse, Lights.getArray('diffuse'));
                gl.uniform3fv(prg.uLightDirection, Lights.getArray('direction'));
            },

            load: function() {
                Floor.build(80, 2);
                Scene.addObject(Floor);
                Scene.loadObject('models/geometry/wall.json', 'wall');
                Scene.loadObject('models/geometry/smallsph.json', 'light1');
                Scene.loadObject('models/geometry/smallsph.json', 'light2');
                Scene.loadObject('models/geometry/smallsph.json', 'light3');
            },

            draw: function() {
                gl.viewport(0, 0, width, height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                transforms.updatePerspective();

                try {
                    gl.uniform3fv(prg.uLightPosition, Lights.getArray("position"));

                    var objects = Scene.getObj();
                    for (var i = 0; i < objects.length; i++) {
                        var object = objects[i];

                        transforms.calculateModelView();
                        // 放入栈中
                        transforms.push();

                        gl.uniform1i(prg.uLightSource, false);

                        if (object.alias == 'light1') {
                            mat4.translate(transforms.mvMatrix, Lights.get('red').position);
                            object.diffuse = Lights.get('red').diffuse;
                            gl.uniform1i(prg.uLightSource, true);
                        }

                        if (object.alias == 'light2') {
                            mat4.translate(transforms.mvMatrix, Lights.get('green').position);
                            object.diffuse = Lights.get('green').diffuse;
                            gl.uniform1i(prg.uLightSource, true);
                        }

                        if (object.alias == 'light3') {
                            mat4.translate(transforms.mvMatrix, Lights.get('blue').position);
                            object.diffuse = Lights.get('blue').diffuse;
                            gl.uniform1i(prg.uLightSource, true);
                        }

                        transforms.setMatrixUniforms();
                        // 从栈中取出缓存的MVMatrix
                        transforms.pop();

                        gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                        gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
                        gl.uniform1i(prg.uWireframe, object.wireframe);

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
            }
        };

        main.init();
    });