/**
 * webglApp
 * @author: gonghao.gh
 * @date: 2014-05-18
 */
KISSY.add('lib/webGLApp', function(S, Node, Base, Utils, Program) {

    var WEBGLAPP_RENDER = null,
        WEBGLAPP_TIMER_ID = -1,
        WEBGLAPP_RENDER_RATE = 33;

    var renderLoop = function() {
        WEBGLAPP_TIMER_ID = setInterval(WEBGLAPP_RENDER, WEBGLAPP_RENDER_RATE);
    }

    window.onblur = function() {
        clearInterval(WEBGLAPP_TIMER_ID);
    }

    window.onfocus = function() {
        renderLoop();
    }

    function WebGLApp(comConfig) {
        var self = this;
        WebGLApp.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(WebGLApp, Base, {

        init: function() {
            var id = this.get("canvasId");
            this.loadSceneHook = null;
            this.configureGLHook = null;
            gl = Utils.getGLContext(id);
            Program.load();
        },

        run: function() {
            if (!this.configureGLHook) {
                alert('The WebGL application cannot start because the configureGLHook has not been specified');
                return;
            }
            if (!this.loadSceneHook){
                alert('The WebGL application cannot start because the loadSceneHook has not been specified');
                return;
            }
            if (!this.drawSceneHook){
                alert('The WebGL application cannot start because the drawSceneHook has not been specified');
                return;
            }

            this.configureGLHook();
            this.loadSceneHook();
            WEBGLAPP_RENDER = this.drawSceneHook;
            renderLoop();
        },

        refresh: function() {
            if (WEBGLAPP_RENDER) {
                WEBGLAPP_RENDER();
            }
        }

    }, {
        ATTS: {
        }
    });

    return WebGLApp;

}, {
    requires: [
        'node',
        'base',
        'lib/utils',
        'lib/program'
    ]
});