/**
 * 地板模块
 * @author: gonghao.gh
 * @date: 2013-11-27
 */

KISSY.add(function() {
    var Floor = {
        alias: 'floor',
        wireframe: true,
        dim: 50,
        lines: 50,
        vertices: [],
        indices: [],
        diffuse: [0.7, 0.7, 0.7, 1.0],
        build: function(d, e) {
            if (d) Floor.dim = d;
            if (e) Floor.lines = 2*Floor.dim/e;
            var inc = 2*Floor.dim/Floor.lines;
            var v = [];
            var i = [];

            for(var l=0;l<=Floor.lines;l++){
                v[6*l] = -Floor.dim; 
                v[6*l+1] = 0;
                v[6*l+2] = -Floor.dim+(l*inc);
                
                v[6*l+3] = Floor.dim;
                v[6*l+4] = 0;
                v[6*l+5] = -Floor.dim+(l*inc);
                
                v[6*(Floor.lines+1)+6*l] = -Floor.dim+(l*inc); 
                v[6*(Floor.lines+1)+6*l+1] = 0;
                v[6*(Floor.lines+1)+6*l+2] = -Floor.dim;
                
                v[6*(Floor.lines+1)+6*l+3] = -Floor.dim+(l*inc);
                v[6*(Floor.lines+1)+6*l+4] = 0;
                v[6*(Floor.lines+1)+6*l+5] = Floor.dim;
                
                i[2*l] = 2*l;
                i[2*l+1] = 2*l+1;
                i[2*(Floor.lines+1)+2*l] = 2*(Floor.lines+1)+2*l;
                i[2*(Floor.lines+1)+2*l+1] = 2*(Floor.lines+1)+2*l+1;        
            }
            Floor.vertices = v;
            Floor.indices = i;
        }
    };

    return Floor;
});