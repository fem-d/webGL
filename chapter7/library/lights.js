/**
 * lights
 * @author: gonghao.gh
 * @date: 2014-05-15
 */
KISSY.add("lib/lights", function() {

    var list = [];

    return {
        add: function(light) {
            list.push(light);
        },

        getArray: function(type) {
            var a = [];
            for (var i = 0, max = list.length; i < max; i++) {
                a = a.concat(list[i][type]);
            }
            return a;
        },

        get: function(idx) {
            if ((typeof idx == 'number') && idx >= 0 && idx < list.length) {
                return list[idx];
            } else if (typeof idx == 'string') {
                for (var i = 0, max = list.length; i < max; i++) {
                    if (list[i].id == idx) {
                        return list[i];
                    }
                }
                throw 'Light ' + idx + ' does not exist';
            } else {
                throw 'Unknown parameter';
            }
        }
    }
});