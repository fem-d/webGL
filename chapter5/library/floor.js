/**
 * floor
 * @author: gonghao.gh
 * @date: 2014-05-18
 */
KISSY.add("lib/floor", function() {

    return {
        alias: 'floor',
        wireframe: true,
        dim: 50,
        lines: 50,
        vertices: [],
        indices: [],
        diffuse: [0.7,0.7,0.7,1.0],
        build: function(d, e){
            if (d) this.dim = d;
            if (e) this.lines = 2*this.dim/e;
            var inc = 2*this.dim/this.lines;
            var v = [];
            var i = [];

            for(var l=0;l<=this.lines;l++){
                v[6*l] = -this.dim;
                v[6*l+1] = 0;
                v[6*l+2] = -this.dim+(l*inc);

                v[6*l+3] = this.dim;
                v[6*l+4] = 0;
                v[6*l+5] = -this.dim+(l*inc);

                v[6*(this.lines+1)+6*l] = -this.dim+(l*inc);
                v[6*(this.lines+1)+6*l+1] = 0;
                v[6*(this.lines+1)+6*l+2] = -this.dim;

                v[6*(this.lines+1)+6*l+3] = -this.dim+(l*inc);
                v[6*(this.lines+1)+6*l+4] = 0;
                v[6*(this.lines+1)+6*l+5] = this.dim;

                i[2*l] = 2*l;
                i[2*l+1] = 2*l+1;
                i[2*(this.lines+1)+2*l] = 2*(this.lines+1)+2*l;
                i[2*(this.lines+1)+2*l+1] = 2*(this.lines+1)+2*l+1;
            }
            this.vertices = v;
            this.indices = i;

            return this;
        }
    }
});