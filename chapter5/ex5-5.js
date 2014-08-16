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

        var updateLightPosition = false;

        var CONTROL_POINTS = [[-25, 0, 20], [-40, 0, -10], [0, 0, 10], [25, 0, -5], [40, 0, -20]];
        var ISTEPS = 1000;
        var DIM_X = 80;
        var DIM_Z = 80;

        var I_LINEAR = 0;
        var I_POLYNOMIAL = 1;
        var I_BSPLINE = 2;

        var INTERPOLATION_TYPE = I_LINEAR;

        var position = [];
        var ANIMATION_TIMER = -1;

        var pos = {
            "0": [[-25, 0, 20], [-40, 0, -10], [0, 0, 10], [25, 0, -5], [40, 0, -20]],
            "1": [[21, 0, 23], [-3, 0, -10], [-21, 0, -53], [50, 0, -31], [-24, 0, 2]],
            "2": [[-21, 0, 23], [32, 0, -10], [0, 0, -53], [-32, 0, -10], [21, 0, 23]]
        }

        // 判断是否临近某控制点
        function close(c1, c0, r) {
            return (Math.sqrt((c1[0] - c0[0]) * (c1[0] - c0[0]) + (c1[1] - c0[1]) * (c1[1] - c0[1]) + (c1[2] - c0[2]) * (c1[2] - c0[2])) <= r);
        }

        // 辅助函数
        function doLinearnterpolate() {

            position = [];
            var start = CONTROL_POINTS[0];
            var end = CONTROL_POINTS[CONTROL_POINTS.length-1];

            var X0 = start[0],
                Y0 = start[1],
                Z0 = start[2];

            var X1 = end[0],
                Y1 = end[1],
                Z1 = end[2];

            var dx = (X1 - X0)/ISTEPS,
                dy = (Y1 - Y0)/ISTEPS,
                dz = (Z1 - Z0)/ISTEPS;

            for (var i = 0; i < ISTEPS; i++) {
                position.push([X0+(dx*i), Y0+(dy*i), Z0+(dz*i)]);
            }

        }

        function doLagrangeInterpolation() {

            position = [];
            var N = CONTROL_POINTS.length;
            var dT = ISTEPS / (N - 1);
            var D = [];

            for (var i = 0; i < N; i++) {
                D[i] = 1;
                for (var j = 0; j < N; j++) {
                    if (i == j) {
                        continue;
                    }
                    D[i] *= dT * (i - j);
                }
            }

            var Lk = function(x, axis) {
                var R = [];
                var S = 0;
                for (var i = 0; i < N; i++) {
                    R[i] = 1;
                    for (var j = 0; j < N; j++) {
                        if (i == j) {
                            continue;
                        }
                        R[i] *= (x - j * dT);
                    }
                    R[i] /= D[i];
                    S += (R[i] * CONTROL_POINTS[i][axis]);
                }
                return S;
            }

            for (var k = 0; k < ISTEPS; k++) {
                position.push([Lk(k, 0), Lk(k, 1), Lk(k, 2)]);
            }

        }

        function doBSplineInterpolation() {

            position = [];
            var N = CONTROL_POINTS.length - 1;
            var P = 3; // degree
            var U = []; // Knot Vector
            var M = N + P + 1; // number of elements in the knot vector
            var deltaKnot = 1 / (M - (2 * P));

            //Creating the knot vector (clamped):
            //http://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node17.html
            for (var i = 0; i <= P; i++) {
                U.push(0);
            }

            var v = deltaKnot;
            for (var i = P + 1; i < M - P + 1; i++) {
                U.push(v);
                v += deltaKnot;
            }
            for (var i = M - P + 1; i <= M; i++) {
                U.push(1);
            }

            function No(u, i) {
                if (U[i] <= u && u < U[i + 1]) {
                    return 1;
                } else {
                    return 0;
                }
            }

            // Bp function
            function Np(u, i, p) {
                var A = 0;
                var B = 0;
                if (p - 1 == 0) {
                    A = No(u, i);
                    B = No(u, i + 1);
                } else {
                    A = Np(u, i, p - 1);
                    B = Np(u, i + 1, p - 1);
                }

                var coeffA = 0;
                var coeffB = 0;
                if (U[i + p] - U[i] != 0 ) {
                    coeffA = (u - U[i]) / (U[i + p] -U[i]);
                }
                if (U[i + p + 1] - U[i + 1] != 0 ) {
                    coeffB = (U[i + p + 1] - u) / (U[i + p + 1] - U[i + 1]);
                }
                return coeffA * A + coeffB * B;
            }

            function C(t) {
                var result = [];
                for (var j = 0; j <3; j++) {         //iterate over axes
                    var sum = 0;
                    for (var i = 0; i <= N; i++) {    //iterate over control points
                        sum += CONTROL_POINTS[i][j] * Np(t, i, P);
                    }
                    result[j] = sum;
                }
                return result;
            };

            var dT = 1 / ISTEPS;
            var t = 0;
            do {
                position.push(C(t));
                t += dT;
            } while(t < 1.0);
            position.push(C(1.0));
        }

        function interpolate() {
            if (INTERPOLATION_TYPE == I_LINEAR) {
                doLinearnterpolate();
            } else if (INTERPOLATION_TYPE == I_POLYNOMIAL) {
                doLagrangeInterpolation();
            } else if (INTERPOLATION_TYPE == I_BSPLINE) {
                doBSplineInterpolation();
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

                // event
                this.bindEvent();
            },

            bindEvent: function() {
                var self = this;
                $(".type-con").delegate("click", "span", function(e) {

                    var $target = $(e.currentTarget),
                        type = $target.attr("data-type"),
                        steps = +$target.attr("data-steps"),
                        position = pos[type];

                    if ($target.hasClass("active")) {
                        return;
                    }
                    $(".active").removeClass("active");
                    $target.addClass("active");

                    self.resetAnimation();
                    CONTROL_POINTS = position;
                    ISTEPS = steps;
                    INTERPOLATION_TYPE = +type;
                    interpolate();
                });
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

                interpolate();
            },

            load: function() {
                var floor = Floor.build(DIM_Z, 2);
                Scene.addObject(floor);
                Scene.loadObject('models/geometry/ball.json', 'ball', {'diffuse': [0.5, 0.9, 0.3, 1.0]});
                Scene.loadObject('models/geometry/flag.json', 'flagInicio', {'diffuse': [0.1, 0.3, 0.9, 1.0]});
                Scene.loadObject('models/geometry/flag.json', 'flagFin', {'diffuse': [0.9, 0.3, 0.1, 1.0]});
                Scene.loadObject('models/geometry/flag.json', 'flagControl1', {'diffuse': [0.4, 0.4, 0.4, 1.0]});
                Scene.loadObject('models/geometry/flag.json', 'flagControl2', {'diffuse': [0.4, 0.4, 0.4, 1.0]});
                Scene.loadObject('models/geometry/flag.json', 'flagControl3', {'diffuse': [0.4, 0.4, 0.4, 1.0]});
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
                            if (position[sceneTime] != undefined) {
                                mat4.translate(transforms.mvMatrix, position[sceneTime]);
                            }
                        } else if (object.alias == 'flagInicio') {
                            mat4.translate(transforms.mvMatrix, CONTROL_POINTS[0]);
                        } else if (object.alias == 'flagFin') {
                            mat4.translate(transforms.mvMatrix, CONTROL_POINTS[4]);
                        } else if (object.alias == 'flagControl1') {
                            if (INTERPOLATION_TYPE != I_LINEAR) {
                                mat4.translate(transforms.mvMatrix, CONTROL_POINTS[1]);
                                if (close(CONTROL_POINTS[1], position[sceneTime], 3)) {
                                    object.diffuse = [0.92, 0.92, 0.4, 1.0];
                                } else {
                                    object.diffuse = [0.4, 0.4, 0.4, 1.0];
                                }
                            } else {
                                transforms.pop();
                                continue;
                            }
                        } else if (object.alias == 'flagControl2') {
                            if (INTERPOLATION_TYPE != I_LINEAR) {
                                mat4.translate(transforms.mvMatrix, CONTROL_POINTS[2]);
                                if (close(CONTROL_POINTS[2], position[sceneTime], 3)) {
                                    object.diffuse = [0.92, 0.92, 0.4, 1.0];
                                } else {
                                    object.diffuse = [0.4, 0.4, 0.4, 1.0];
                                }
                            } else {
                                transforms.pop();
                                continue;
                            }
                        } else if (object.alias == 'flagControl3') {
                            if (INTERPOLATION_TYPE != I_LINEAR) {
                                mat4.translate(transforms.mvMatrix, CONTROL_POINTS[3]);
                                if (close(CONTROL_POINTS[3], position[sceneTime], 3)) {
                                    object.diffuse = [0.92, 0.92, 0.4, 1.0];
                                } else {
                                    object.diffuse = [0.4, 0.4, 0.4, 1.0];
                                }
                            } else {
                                transforms.pop();
                                continue;
                            }
                        }
                        transforms.setMatrixUniforms();
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

            resetAnimation: function() {
                sceneTime = 0;
                position.length = 0;
            },

            startAnimation: function() {
                ANIMATION_TIMER = setInterval(this.animate.bind(this), 30/1000);
            },

            stopAnimation: function() {
                clearInterval(ANIMATION_TIMER);
            }
        };

        main.init();
    });