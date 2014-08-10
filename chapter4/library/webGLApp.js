/**
 * webGL总控
 * @author: gonghao.gh
 * @date: 2013-11-26
 */

KISSY.add(function(S, Utils, Program) {

	var nop = function() {},
		WEBGLAPP_RENDER_RATE = 33;

	var webGLApp_timer_id = -1;
	
	var WebGLApp = function(canvas) {
		this.loadSceneHook = nop;
		this.configureGLHook = nop;
		this.drawSceneHook = nop;
		window.gl = Utils.getGLContext(canvas);
        window.prg = {};
		Program.load();
	};

    WebGLApp.prototype.renderLoop = function() {
        var self = this;
        webGLApp_timer_id = setInterval(self.drawSceneHook, WEBGLAPP_RENDER_RATE);
    };

	WebGLApp.prototype.run = function() {
        var self = this;
		if (this.configureGLHook === nop) {
			alert('Error! The WebGL application cannot start because the configureGLHook has not been specified'); return;
        }
        if (this.loadSceneHook === nop){
            alert('Error! The WebGL application cannot start because the loadSceneHook has not been specified'); return;
        }
        if (this.drawSceneHook === nop){
            alert('Error! The WebGL application cannot start because the drawSceneHook has not been specified'); return;
        }

        this.configureGLHook();
        this.loadSceneHook();
        setTimeout(function() {
            self.renderLoop();
        }, 1000);
	};

	WebGLApp.prototype.refresh = function() {
		if (this.drawSceneHook != nop) {
			this.drawSceneHook();
		}
	};

	return WebGLApp;
}, {
	requires: [
		"./utils",
		"./program"
	]
});