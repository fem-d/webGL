/**
 * 场景动画效果模块
 * @author: gonghao.gh
 * @date: 2013-11-26
 */

KISSY.add(function() {
	
	var SceneTransforms = function(camera) {
		this.stack = [];
		this.camera = camera;
		this.mvMatrix = mat4.create();
		this.pMatrix = mat4.create();
		this.nMatrix = mat4.create();
		this.cMatrix = mat4.create();
	};

	SceneTransforms.prototype.calculateModelView = function() {
		this.mvMatrix = this.camera.getViewTransform();
	};

	SceneTransforms.prototype.calculateNormal = function() {
		mat4.identity(this.nMatrix);
		mat4.set(this.mvMatrix, this.nMatrix);
		mat4.inverse(this.nMatrix);
		mat4.transpose(this.nMatrix);
	};

	SceneTransforms.prototype.calculatePerspective = function() {
		mat4.identity(this.pMatrix);
		mat4.perspective(30, c_width/c_height, 0.1, 1000.0, this.pMatrix);
	};

	SceneTransforms.prototype.init = function() {
		this.calculateModelView();
		this.calculateNormal();
		this.calculatePerspective();
	};

	SceneTransforms.prototype.updatePerspective = function() {
		mat4.perspective(30, c_width/c_height, 0.1, 1000.0, this.pMatrix);
	};

	SceneTransforms.prototype.setMatrixUniforms = function() {
		this.calculateNormal();
		gl.uniformMatrix4fv(prg.uMVMatrix, false, this.mvMatrix);
		gl.uniformMatrix4fv(prg.uPMatrix, false, this.pMatrix);
		gl.uniformMatrix4fv(prg.uNMatrix, false, this.nMatrix);
	};

	SceneTransforms.prototype.push = function() {
		var memento = mat4.create();
		mat4.set(this.mvMatrix, memento);
		this.stack.push(memento);
	};

	SceneTransforms.prototype.pop = function() {
		if (this.stack.length == 0) {
			return;
		}
		this.mvMatrix = this.stack.pop();
	};

    return SceneTransforms;
});