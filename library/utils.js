/**
 * 辅助模块
 * @author: gonghao.gh
 * @date: 2013-11-26
 */

KISSY.add(function(S) {

	window.requestAnimFrame = (function() {
    	return window.requestAnimationFrame ||
        	window.webkitRequestAnimationFrame ||
         	window.mozRequestAnimationFrame ||
         	window.oRequestAnimationFrame ||
         	window.msRequestAnimationFrame ||
         	function(callback) {
          		window.setTimeout(callback, 1000/60);
         	};
	})();

	var Utils = {

		getGLContext: function(name) {
			var canvas = document.getElementById(name);
			var ctx = null;

			if (canvas == null) {
				alert("Error! There is no canvas on this page.");
				return null;
			} else {
				c_width = canvas.width;
				c_height = canvas.height;
			}

			var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];

			for (var i = 0, l = names.length; i < l; i++) {
				try {
					ctx = canvas.getContext(names[i]);
				} catch(e) {}

				if (ctx) {
					break;
				}
			}
			if (ctx == null) {
				alert("Error! Could not initialize WebGL.");
				return null;
			} else {
				return ctx;
			}
		},

		calculateNormals: function(vs, ind) {
			var x = 0,
				y = 1,
				z = 2;

			var ns = [];
			for (var i = 0, l = vs.length; i < l; i++) {
				ns[i] = 0.0;
			}

			for (var i = 0, l = ind.length; i < l; i+=3) {
				var v1 = [],
					v2 = [],
					normal = [];

				v1[x] = vs[3*ind[i+1]+x] - vs[3*ind[i]+x];
				v1[y] = vs[3*ind[i+1]+y] - vs[3*ind[i]+y];
				v1[z] = vs[3*ind[i+1]+z] - vs[3*ind[i]+z];

				v2[x] = vs[3*ind[i+2]+x] - vs[3*ind[i+1]+x];
				v2[y] = vs[3*ind[i+2]+y] - vs[3*ind[i+1]+y];
				v2[z] = vs[3*ind[i+2]+z] - vs[3*ind[i+1]+z];
			
				normal[x] = v1[y]*v2[z] - v1[z]*v2[y];
            	normal[y] = v1[z]*v2[x] - v1[x]*v2[z];
            	normal[z] = v1[x]*v2[y] - v1[y]*v2[x];

            	for (var j = 0; j < 3; j++) {
            		ns[3*ind[i+j]+x] = ns[3*ind[i+j]+x] + normal[x];
            		ns[3*ind[i+j]+y] = ns[3*ind[i+j]+y] + normal[y];
            		ns[3*ind[i+j]+z] = ns[3*ind[i+j]+z] + normal[z];
            	}

            	// normalize the result
            	for (var i = 0, l = vs.length; i < l; i+=3) {
            		var nn = [];
            		nn[x] = ns[i+x];
            		nn[y] = ns[i+y];
            		nn[z] = ns[i+z];

            		var len = Math.sqrt((nn[x]*nn[x])+(nn[y]*nn[y])+(nn[z]*nn[z]));
            		if (len == 0) {
            			len = 0.00001;
            		}

            		nn[x] = nn[x]/len;
            		nn[y] = nn[y]/len;
            		nn[z] = nn[z]/len;

            		ns[i+x] = nn[x];
            		ns[i+y] = nn[y];
            		ns[i+z] = nn[z];
            	}
            	return ns;
			}
		}
	};

	return Utils;
});