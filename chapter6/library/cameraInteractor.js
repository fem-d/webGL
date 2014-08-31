/**
 *
 */
KISSY.add('lib/cameraInteractor', function(S, Node, Base) {

    function CameraInteractor(comConfig) {
        var self = this;
        CameraInteractor.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(CameraInteractor, Base, {

        init: function() {
            this.camera = this.get('camera');
            this.canvas = this.get('canvas');
            this.update();

            this.dragging = false;
            this.x = 0;
            this.y = 0;
            this.lastX = 0;
            this.lastY = 0;
            this.button = 0;
            this.ctrl = false;
            this.key = 0;

            this.MOTION_FACTOR = 10.0;
            this.dloc = 0;
            this.dstep = 0;
        },

        onMouseUp: function() {
            this.dragging = false;
        },

        onMouseDown: function(ev) {
            this.dragging = true;
            this.x = ev.clientX;
            this.y = ev.clientY;
            this.button = ev.button;
            this.dstep = Math.max(this.camera.position[0], this.camera.position[1], this.camera.position[2]) / 100;
        },

        onMouseMove: function(ev) {
            this.lastX = this.x;
            this.lastY = this.y;
            this.x = ev.clientX;
            this.y = ev.clientY;

            if (!this.dragging) {
                return;
            }
            this.ctrl = ev.ctrlKey;
            this.alt = ev.altKey;

            var dx = this.x - this.lastX;
            var dy = this.y - this.lastY;

            if (this.button == 0) {
                if (this.alt) {
                    this.dolly(dy);
                } else {
                    this.rotate(dx, dy);
                }
            }
        },

        onKeyDown: function(ev) {
            var camera = this.camera;

            this.key = ev.keyCode;
            this.ctrl = ev.ctrlKey;
            this.alt = ev.altKey;

            if (!this.ctrl) {
                if (this.key == 38) {
                    camera.changeElevation(10);
                } else if (this.key == 40) {
                    camera.changeElevation(-10);
                } else if (this.key == 37) {
                    camera.changeAzimuth(-10);
                } else if (this.key == 39) {
                    camera.changeAzimuth(10);
                }
            }
        },

        onKeyUp: function(ev) {
            if (ev.keyCode == 17) {
                this.ctrl = false;
            }
        },

        update: function() {
            var self = this,
                canvas = this.canvas;

            canvas.onmousedown = function(ev) {
                self.onMouseDown(ev);
            }

            canvas.onmouseup = function(ev) {
                self.onMouseUp(ev);
            }

            canvas.onmousemove = function(ev) {
                self.onMouseMove(ev);
            }

            window.onkeydown = function(ev) {
                self.onKeyDown(ev);
            }

            window.onkeyup = function(ev) {
                self.onKeyUp(ev);
            }
        },

        dolly: function(value) {
            if (value > 0) {
                this.dloc += this.dstep;
            } else {
                this.dloc -= this.dstep;
            }
            this.camera.dolly(this.dloc);
        },

        rotate: function(dx, dy) {
            var camera = this.camera,
                canvas = this.canvas,

                delta_elevation = -20.0 / canvas.height,
                delta_azimuth = -20.0 / canvas.width,

                nAzimuth = dx * delta_azimuth * this.MOTION_FACTOR,
                nElevation = dy * delta_elevation * this.MOTION_FACTOR;

            camera.changeAzimuth(nAzimuth);
            camera.changeElevation(nElevation);
        }

    }, {
        ATTRS: {
        }
    });

    return CameraInteractor;
}, {
    requires: [
        'node',
        'base'
    ]
});