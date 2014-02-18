/**
 * 坐标轴模块
 * @author: gonghao.gh
 * @date: 2013-11-27
 */

KISSY.add(function() {
    var Axis = {
        alias: 'axis',
        dim: 10,
        vertices: [-10,0.0,0.0, 10,0.0,0.0, 0.0,-10/2,0.0, 0.0,10/2,0.0, 0.0,0.0,-10, 0.0,0.0,10],
        indices: [0, 1,	2, 3, 4, 5],
        colors: [1, 1, 0 ,1,  1, 1, 0 ,1,  0, 1 ,0 ,1,  0, 1 ,0 ,1,  0, 0, 1 ,1,  0, 0, 1 ,1],
        wireframe: true,
        perVertexColor: true,
        build: function(d) {
            if (d) {
                Axis.dim = d;
            }
            Axis.vertices = [-d,0.0,0.0, d,0.0,0.0, 0.0,-d/2,0.0, 0.0,d/2,0.0, 0.0,0.0,-d, 0.0,0.0,d];
        }
    };

    return Axis;
});