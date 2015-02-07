/**
 *
 */
KISSY.add("lib/texture", function(S, Node, Base) {

    function Texture(comConfig) {
        var self = this;
        Texture.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(Texture, Base, {

        init: function() {
            var self = this;
            this.tex = gl.createTexture();
            this.image = new Image();
            this.image.onload = function() {
                self.handleLoadedTexture();
            }
        },

        setImage: function(file) {
            this.image.src = file;
        },

        handleLoadedTexture: function(home) {
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

    }, {
        ATTRS: {
        }
    });

    return Texture;
}, {
    requires: [
        'node',
        'base'
    ]
});