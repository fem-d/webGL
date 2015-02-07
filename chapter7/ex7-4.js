/**
 *
 */
KISSY.use('node, lib/webGLApp, lib/program, lib/camera, lib/cameraInteractor, lib/scene, lib/sceneTransforms, lib/texture, lib/floor, lib/axis',
    function(S, Node, WebGLApp, Program, Camera, CameraInteractor, Scene, SceneTransforms, Texture, Floor, Axis) {

    var $ = Node.all;
    var app;

    var interactor,
        transforms;

    var CAMERA_ORBITING_TYPE = 1,
        CAMERA_TRACKING_TYPE = 2;

    var useVertexColors = false;

    var texture = null;
    var texture2 = null;

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
            gl.clearDepth(100.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


            var camera = new Camera({
                type: CAMERA_ORBITING_TYPE
            });
            camera.goHome([0, 0, 4]);
            camera.setFocus([0.0, 0.0, 0.0]);
            camera.setAzimuth(45);
            camera.setElevation(-30);
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
                "uUseLambert",
                "uSampler",
                "uSampler2"
            ];
            // set prg
            Program.load(attributeList, uniformList);

            gl.uniform3fv(prg.uLightPosition, [0, 5, 20]);
            gl.uniform4fv(prg.uLightAmbient, [1.0, 1.0, 1.0, 1.0]);
            gl.uniform4fv(prg.uLightDiffuse, [1.0, 1.0, 1.0, 1.0]);
            gl.uniform1f(prg.uAlpha, 1.0);
            gl.uniform1i(prg.uUseVertexColor, useVertexColors);
            gl.uniform1i(prg.uUseLambert, true);

            texture = new Texture();
            texture.setImage('textures/webgl-marble.png');

            texture2 = new Texture();
            texture2.setImage('textures/light.png');
        },

        load: function() {
            Scene.loadObject('models/geometry/complexCube.json','cube2');
        },

        draw: function() {
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            transforms.updatePerspective();

            try {
                var objects = Scene.getObj();
                for (var i = 0; i < objects.length; i++) {
                    var object = objects[i];

                    if (object.hidden == true) {
                        continue;
                    }

                    transforms.calculateModelView();
                    // 放入栈中
                    transforms.push();
                    transforms.setMatrixUniforms();
                    // 从栈中取出缓存的MVMatrix
                    transforms.pop();

                    gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
                    gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
                    gl.uniform1i(prg.uWireframe, object.wireframe);

                    gl.enableVertexAttribArray(prg.aVertexPosition);
                    //gl.disableVertexAttribArray(prg.aVertexNormal);
                    //gl.disableVertexAttribArray(prg.aVertexColor);

                    gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                    gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(prg.aVertexPosition);

                    gl.uniform1i(prg.uUseVertexColor, useVertexColors);

                    if (object.scalars != null && useVertexColors){
                        gl.enableVertexAttribArray(prg.aVertexColor);
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
                        gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
                    }

                    if (object.texture_coords) {
                        gl.enableVertexAttribArray(prg.aVertexTextureCoords);
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.tbo);
                        gl.vertexAttribPointer(prg.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, texture.tex);
                        gl.uniform1i(prg.uSampler, 0);

                        gl.activeTexture(gl.TEXTURE1);
                        gl.bindTexture(gl.TEXTURE_2D, texture2.tex);
                        gl.uniform1i(prg.uSampler2, 1);
                    }

                    // 清除webgl中的warning
                    // @see also：http://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-this-has-significant-performance-penalt
//                    gl.bindAttribLocation(prg, 0, 'a_Position');
//                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
//                    gl.enableVertexAttribArray(0);

//                    if(!object.wireframe){
//                        gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
//                        gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
//                        gl.enableVertexAttribArray(prg.aVertexNormal);
//                    }
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