/**
 * 摄像头模块
 * @author: gonghao.gh
 * @date: 2013-11-26
 */

KISSY.add(function() {

	var CAMERA_ORBITING_TYPE = 1,
		CAMERA_TRACKING_TYPE = 2;

	var Camera = function(type) {
		this.matrix = mat4.create();
		this.up = vec3.create();
		this.right = vec3.create();
		this.normal = vec3.create();
		this.position = vec3.create();
		this.focus = vec3.create();
		this.azimuth = 0.0;
		this.elevation = 0.0;
		this.type = type;
		this.steps = 0;

		this.home = vec3.create();

		this.hookRenderer = null;
		this.hookGUIUpdate = null;
	};

	Camera.prototype.setType = function(type) {
		this.type = type;

		if (type != CAMERA_TRACKING_TYPE && type != CAMERA_ORBITING_TYPE) {
			alert("Error! Wrong Camera Type");
			this.type = CAMERA_ORBITING_TYPE;
		}
	};

	Camera.prototype.goHome = function(home) {
		if (home != null) {
			this.home = home;
		}

		this.setPosition(this.home);
		this.setAzimuth(0);
		this.setElevation(0);
		this.steps = 0;
	};

	Camera.prototype.dolly = function(steps) {
		var projection = vec3.create(),
			normal = vec3.create(),
			step = this.steps-steps,
			newPosition = vec3.create();

		projection = self.position;
		vec3.normalize(this.normal, normal);

		if (this.type == CAMERA_TRACKING_TYPE) {
			newPosition[0] = projection[0] - step*normal[0];
			newPosition[1] = projection[1] - step*normal[1];
			newPosition[2] = projection[2] - step*normal[2];
		} else {
			newPosition[0] = projection[0];
			newPosition[1] = projection[1];
			newPosition[2] = porjection[2] - step;
		}

		this.setPosition(newPosition);
		this.steps = steps;
	};

	Camera.prototype.setPosition = function(pos) {
		vec3.set(pos, this.position);
		this.update();
	};

	Camera.prototype.setFocus = function(focus) {
		vec3.set(focus, this.focus);
		this.update();
	};

	Camera.prototype.setAzimuth = function(azimuth) {
		this.changeAzimuth(azimuth - this.azimuth);
	};

	Camera.prototype.changeAzimuth = function(azimuth) {
		this.azimuth += azimuth;

		if (this.azimuth > 360 || this.azimuth < -360) {
			this.azimuth = this.azimuth % 360;
		}
		this.update();
	};

	Camera.prototype.setElevation = function(elevation) {
	    this.changeElevation(elevation - this.elevation);
	};

	Camera.prototype.changeElevation = function(elevation) {
	    this.elevation += elevation;
	    
	    if (this.elevation > 360 || this.elevation <-360) {
			this.elevation = this.elevation % 360;
		}
	    this.update();
	};

	Camera.prototype.calculateOrientation = function() {
		var m = this.matrix;
		mat4.multiplyVec4(m, [1, 0, 0, 0], this.right);
		mat4.multiplyVec4(m, [0, 1, 0, 0], this.up);
		mat4.multiplyVec4(m, [0, 0, 1, 0], this.normal);
	};

	Camera.prototype.update = function() {
		mat4.identity(this.matrix);

		this.calculateOrientation();

		if (this.type == CAMERA_TRACKING_TYPE) {
			mat4.translate(this.matrix, this.position);
			mat4.rotateY(this.matrix, this.azimuth*Math.PI/180);
			mat4.rotateX(this.matrix, this.elevation*Math.PI/180);
		} else {
			mat4.rotateY(this.matrix, this.azimuth*Math.PI/180);
			mat4.rotateX(this.matrix, this.elevation*Math.PI/180);
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
	};

	Camera.prototype.getViewTransform = function() {
		var m = mat4.create();
		mat4.inverse(this.matrix, m);
		return m;
	};

	return Camera;
});