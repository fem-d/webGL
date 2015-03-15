/**
 * lights
 * @author: gonghao.gh
 * @date: 2014-10-17
 */
KISSY.add('lib/light', function(S, Node, Base) {

    function Light(comConfig) {
        var self = this;
        Light.superclass.constructor.call(self, comConfig);
        self.init();
    }

    S.extend(Light, Base, {

        init: function() {
            this.id = this.get('name');
            this.position = [0.0, 0.0, 0.0];
            this.ambient = [0.0, 0.0, 0.0, 0.0];
            this.diffuse = [0.0, 0.0, 0.0, 0.0];
            this.specular = [0.0, 0.0, 0.0, 0.0];
        },

        setPosition: function(p) {
            this.position = p.slice(0);
        },

        setDiffuse: function(d) {
            this.diffuse = d.slice(0);
        },

        setAmbient: function(a) {
            this.ambient = a.slice(0);
        },

        setSpecular: function(s) {
            this.specular = s.slice(0);
        },

        setProperty: function(pName, pVlaue) {
            if (typeof pName == 'string') {
                if (pVlaue instanceof Array) {
                    this[pName] = pVlaue.slice(0);
                } else {
                    this[pName] = pVlaue;
                }
            } else {
                throw 'The property name must be a string';
            }
        }

    }, {
        ATTRS: {
        }
    });

    return Light;

}, {
    requires: [
        'node',
        'base'
    ]
});