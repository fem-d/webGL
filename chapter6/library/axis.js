/**
 * axis
 * @author: gonghao.gh
 * @date: 2014-05-15
 */
KISSY.add("lib/axis", function() {

    return {
        alias: 'axis',
        dim: 10,
        vertices: [-10,0.0,0.0, 10,0.0,0.0, 0.0,-10/2,0.0, 0.0,10/2,0.0, 0.0,0.0,-10, 0.0,0.0,10],
        indices: [0, 1,  2, 3, 	4, 5],
        colors: [1, 1, 0 ,1,  1, 1, 0 ,1,  0, 1 ,0 ,1,  0, 1 ,0 ,1,  0, 0, 1 ,1,  0, 0, 1 ,1],
        wireframe: true,
        perVertexColor: true,
        build: function(d){
            if (d) {
                this.dim = d;
            }
            this.vertices = [-d,0.0,0.0, d,0.0,0.0, 0.0,-d/2,0.0, 0.0,d/2,0.0, 0.0,0.0,-d, 0.0,0.0,d];
            return this;
        }
    }
});