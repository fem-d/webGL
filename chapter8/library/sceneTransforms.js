/**
 * sceneTransforms
 * @author: gonghao.gh
 * @date: 2014-05-18
 */
KISSY.add('lib/sceneTransforms', function(S, Node, Base) {

    function SceneTransforms(comConfig) {
        var self = this;
        SceneTransforms.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(SceneTransforms, Base, {

        init: function() {
            this.stack = [];
            this.camera = this.get('camera');
            this.mvMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.nMatrix = mat4.create();
            this.cMatrix = mat4.create();
        },

        calculateModelView: function() {
            this.mvMatrix = this.camera.getViewTransform();
        },

        calculateNormal: function() {
            mat4.identity(this.nMatrix);
            mat4.set(this.mvMatrix, this.nMatrix);
            mat4.inverse(this.nMatrix);
            mat4.transpose(this.nMatrix);
        },

        calculatePerspective: function() {
            mat4.identity(this.pMatrix);
            mat4.perspective(30, width / height, 0.1, 1000.0, this.pMatrix);
        },

        startup: function() {
            this.calculateModelView();
            this.calculatePerspective();
            this.calculateNormal();
        },

        updatePerspective: function() {
            mat4.perspective(30, width / height, 0.1, 1000.0, this.pMatrix);
        },

        setMatrixUniforms: function() {
            this.calculateNormal();
            gl.uniformMatrix4fv(prg.uMVMatrix, false, this.mvMatrix);
            gl.uniformMatrix4fv(prg.uPMatrix, false, this.pMatrix);
            gl.uniformMatrix4fv(prg.uNMatrix, false, this.nMatrix);
        },

        push: function() {
            var memo = mat4.create();
            mat4.set(this.mvMatrix, memo);
            this.stack.push(memo);
        },

        pop: function() {
            if (this.stack.length == 0) {
                return;
            }
            this.mvMatrix = this.stack.pop();
        }

    }, {
        ATTRS: {
        }
    });

    return SceneTransforms;

}, {
    requires: [
        'node',
        'base'
    ]
});