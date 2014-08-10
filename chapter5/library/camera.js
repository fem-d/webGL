/**
 *
 */
KISSY.add("lib/camera", function(S, Node, Base) {

    var CAMERA_ORBITING_TYPE = 1,
        CAMERA_TRACKING_TYPE = 2;

    function Camera(comConfig) {
        var self = this;
        Camera.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(Camera, Base, {

        init: function() {
            // camera matrix
            this.matrix = mat4.create();

            this.up = vec3.create();
            this.right = vec3.create();

            this.normal = vec3.create();
            this.position = vec3.create();
            this.focus = vec3.create();
            this.azimuth = 0.0;
            this.elevation = 0.0;
            this.type = this.get('type');
            this.steps = 0;

            this.home = vec3.create();

            this.hookRenderer = null;
            this.hookGUIUpdate = null;
        },

        setType: function(type) {
            this.type = type;

            if (type != CAMERA_ORBITING_TYPE && type != CAMERA_TRACKING_TYPE) {
                alert('Wrong Camera Type!. Setting Orbitting type by default');
                this.type = CAMERA_ORBITING_TYPE;
            }
        },

        goHome: function(home) {
            if (home) {
                this.home = home;
            }

            this.setPosition(this.home);
            this.setAzimuth(0);
            this.setElevation(0);
            this.steps = 0;
        },

        dolly: function(steps) {
            var position = vec3.create(),
                normal = vec3.create(),
                step = steps - this.steps;

            position = this.position;
            vec3.normalize(this.normal, normal);

            var newPosition = vec3.create();

            if (this.type == CAMERA_TRACKING_TYPE) {
                newPosition[0] = position[0] - step*normal[0];
                newPosition[1] = position[1] - step*normal[1];
                newPosition[2] = position[2] - step*normal[2];
            } else {
                newPosition[0] = position[0];
                newPosition[1] = position[1];
                newPosition[2] = position[2] - step;
            }

            this.setPosition(newPosition);
            this.steps = steps;
        },

        setPosition: function(position) {
            vec3.set(position, this.position);
            this.update();
        },

        setFocus: function(focus) {
            vec3.set(focus, this.focus);
            this.update();
        },

        setAzimuth: function(azimuth) {
            this.azimuth = azimuth;

            if (this.azimuth > 360 || this.azimuth < -360) {
                this.azimuth = this.azimuth % 360;
            }
            this.update();
        },

        changeAzimuth: function(azimuth) {
            this.azimuth += azimuth;

            if (this.azimuth > 360 || this.azimuth < -360) {
                this.azimuth = this.azimuth % 360;
            }
            this.update();
        },

        setElevation: function(elevation) {
            this.changeElevation(elevation - this.elevation);
        },

        changeElevation: function(elevation) {
            this.elevation += elevation;

            if (this.elevation > 360 || this.elevation < -360) {
                this.elevation = this.elevation % 360;
            }
            this.update();
        },

        calculateOrientation: function() {
            var m = this.matrix;
            mat4.multiplyVec4(m, [1, 0, 0, 0], this.right);
            mat4.multiplyVec4(m, [0, 1, 0, 0], this.up);
            mat4.multiplyVec4(m, [0, 0, 1, 0], this.normal);
        },

        update: function() {
            mat4.identity(this.matrix);

            //this.calculateOrientation();

            if (this.type == CAMERA_TRACKING_TYPE) {
                mat4.translate(this.matrix, this.position);
                mat4.rotateY(this.matrix, this.azimuth * Math.PI / 180);
                mat4.rotateX(this.matrix, this.elevation * Math.PI / 180);
            } else {
                mat4.rotateY(this.matrix, this.azimuth * Math.PI / 180);
                mat4.rotateX(this.matrix, this.elevation * Math.PI / 180);
                mat4.translate(this.matrix, this.position);
            }

            this.calculateOrientation();

            if (this.type == CAMERA_TRACKING_TYPE) {
                mat4.multiplyVec4(this.matrix, [0, 0, 0, 1], this.position);
            }

            if (this.hookRenderer) {
                this.hookRenderer();
            }
            if (this.hookGUIUpdate) {
                this.hookGUIUpdate();
            }
        },

        getViewTransform: function() {
            var m = mat4.create();
            mat4.inverse(this.matrix, m);
            return m;
        }

    }, {
        ATTRS: {
        }
    });

    return Camera;
}, {
    requires: [
        'node',
        'base'
    ]
});