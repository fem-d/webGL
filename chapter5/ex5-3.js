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

        var ball = [];
        var BALL_GRAVITY = 9.8;
        var NUM_BALLS = 500;

        var animationRate = 15; /* 15ms */
        var elapsedTime = undefined;
        var initialTime = undefined;

        var updateLightPosition = false;

        // 辅助函数
        function generatePosition() {
            var x = Math.floor(Math.random()*50);
            var y = Math.floor(Math.random()*30)+50;
            var z = Math.floor(Math.random()*50);

            var flagX = Math.floor(Math.random()*10);
            var flagZ = Math.floor(Math.random()*10);

            if (flagX >= 5) {
                x = -x;
            }
            if (flagZ >= 5) {
                z = -z;
            }
            return [x, y, z];
        }

        // class BouncingBall
        function BouncingBall(x, y, z) {
            this.H0 = y;
            this.V0 = 0;
            this.VF = Math.sqrt(2 * BALL_GRAVITY * this.H0);
            this.HF = 0;
            this.bouncing_time = 0;
            this.position = [x, y, z];
            this.BOUNCINESS = (Math.random() + 0.5);
            this.color = [Math.random(), Math.random(), Math.random(), 1.0];
        }

        BouncingBall.prototype.update = function(time) {
            var t = time - this.bouncing_time;
            // update position
            var h = this.position[1];
            h = this.H0 + (this.V0 * t) - (0.5 * BALL_GRAVITY * t * t);

            if (h <= 0) {
                this.bouncing_time = time;
                this.V0 = this.VF * this.BOUNCINESS;
                this.HF = (this.V0 * this.V0) / (2 * BALL_GRAVITY);
                this.VF = Math.sqrt(2 * BALL_GRAVITY * this.HF);
                this.H0 = 0;
            } else {
                this.position[1] = h;
            }
        }

        // 在对象中使用这drawBalls会出现找不到drawBalls的请求，原因不明
        var drawBall = function(ball, sphere) {
            gl.uniform3fv(prg.uTranslation, ball.position);
            gl.uniform4fv(prg.uMaterialDiffuse, ball.color);
            gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        var drawBalls = function(object) {
            gl.uniform4fv(prg.uMaterialSpecular, object.specular);
            gl.uniform4fv(prg.uMaterialAmbient, object.ambient);

            gl.uniform1i(prg.uWireframe, false);
            gl.uniform1i(prg.uPerVertexColor, false);
            gl.uniform1i(prg.uTranslate, true);

            gl.enableVertexAttribArray(prg.aVertexPosition);
            gl.disableVertexAttribArray(prg.aVertexNormal);
            gl.disableVertexAttribArray(prg.aVertexColor);

            gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
            gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(prg.aVertexPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
            gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(prg.aVertexNormal);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

            for (var j = 0; j < NUM_BALLS; j++) {
                drawBall(ball[j], object);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
                camera.goHome([0, 2, 70]);
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

                // create program variable that maps the uniform uTranslation
                prg.uTranslation = gl.getUniformLocation(prg, "uTranslation");
                gl.uniform3fv(prg.uTranslation, [0, 0, 0]);

                prg.uTranslate = gl.getUniformLocation(prg, "uTranslate");
                gl.uniform1i(prg.uTranslate, false);

                for (var i = 0; i < NUM_BALLS; i++) {
                    var pos = generatePosition();
                    ball.push(new BouncingBall(pos[0], pos[1], pos[2]));
                }
            },

            load: function() {
                var floor = Floor.build(80, 2);
                Scene.addObject(floor);
                Scene.loadObject("models/geometry/ball.json", "ball");
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
                        transforms.setMatrixUniforms();

                        if (object.alias == 'ball') {
                            drawBalls(object);
                            continue;
                        }

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
                for (var i = 0; i < ball.length; i++) {
                    ball[i].update(sceneTime);
                }
                sceneTime += 33/1000;
                this.draw();
            },

            onFrame: function() {
                elapsedTime = +new Date() - initialTime;
                if (elapsedTime < animationRate) {
                    return;
                }

                var steps = Math.floor(elapsedTime / animationRate);
                while (steps) {
                    this.animate();
                    steps -= 1;
                }
                initialTime = +new Date();
            },

            startAnimation: function() {
                var self = this;
                initialTime = +new Date();
                setInterval(self.onFrame.bind(self), animationRate/1000);
            }
        };

        main.init();
});