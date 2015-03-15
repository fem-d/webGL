/**
 *
 */
KISSY.add('lib/picker', function(S, Node, Base) {

    function Picker(comConfig) {
        var self = this;
        Picker.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(Picker, Base, {

        init: function() {
            this.plist = [];
            this.canvas = this.get('canvas');
            this.scene = this.get('scene');
            this.draw = this.get('draw');
            this.texture = null;
            this.framebuffer = null;
            this.renderbuffer = null;

            this.processHitsCallback = null;
            this.addHitCallback = null;
            this.removeHitCallback = null;
            this.hitPropertyCallback = null;
            this.moveCallback = null;

            this.configure();
        },

        configure: function() {
            var width = this.canvas.width;
            var height = this.canvas.height;

            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            this.renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },

        update: function() {
            var width = this.canvas.width;
            var height = this.canvas.height;

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        },

        _compare: function(readout, color) {
            console.log(readout, [color[0]*255,color[1]*255, color[2]*255]);
            return (Math.abs(Math.round(color[0]*255) - readout[0]) <= 1 &&
            Math.abs(Math.round(color[1]*255) - readout[1]) <= 1 &&
            Math.abs(Math.round(color[2]*255) - readout[2]) <= 1);
        },

        find: function(coords) {
            var readout = new Uint8Array(1 * 1 * 4);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.readPixels(coords.x, coords.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readout);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            var found = false;

            if (this.hitPropertyCallback == undefined) {
                alert('The picker needs an object property to perform the comparison');
                return;
            }

            var objs = this.scene.getObj();
            for (var i = 0, max = objs.length; i < max; i++) {
                var ob = objs[i];
                console.log(ob.alias);
                if (ob.alias == 'floor') {
                    continue;
                }

                var property = this.hitPropertyCallback(ob);
                if (!property) {
                    continue;
                }

                if (this._compare(readout, property)) {
                    var idx = this.plist.indexOf(ob);
                    if (idx != -1) {
                        this.plist.splice(idx, 1);
                        if (this.removeHitCallback) {
                            this.removeHitCallback(ob);
                        }
                    } else {
                        this.plist.push(ob);
                        if (this.addHitCallback) {
                            this.addHitCallback(ob);
                        }
                    }
                    found = true;
                    break;
                }
            }
            this.draw();
            return found;
        },

        stop: function() {
            if (this.processHitsCallback != null && this.plist.length > 0) {
                this.processHitsCallback(this.plist);
            }
            this.plist = [];
        },

        getFramebuffer: function() {
            return this.framebuffer;
        }

    }, {
        ATTRS: {
        }
    });

    return Picker;
}, {
    requires: [
        'node',
        'base'
    ]
});