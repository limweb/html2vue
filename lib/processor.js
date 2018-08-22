var api = require("posthtml/lib/api")
var render = require("posthtml-render")

var uniqEs6 = (arrArg) => {
    return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
    });
}

function getComponentName(node) {
    return node.attrs["data-component"]
}

function isComponent(node) {
    var annotated = node.attrs && getComponentName(node)

    if (annotated !== undefined) {
        if (getComponentName(node).length > 0) {
            return true
        } else {
            throw Error("There's annotated component without a name!")
        }
    }

    return false
}

function collectComponents(components) {
    return function(node) {
        if (isComponent(node)) {
            components.push(node)
        }

        return node
    }
}

function removedataTag(c, cp) {
    if (c.attrs && c.attrs['data-component']) {
        c.cname = c.attrs['data-component'];
        c.tag = c.attrs['data-component'];
        cp.components.push(c.tag);

        delete c.attrs['data-component'];
        delete c.attrs;
        delete c.content;
    } else {
        if (c.content != undefined) {
            c.content = c.content.map(cc => {
                return removedataTag(cc, cp);
            })
        }
    }
    return c;
}

function toHtmlvue(c) {
    let imports = '';
    let comps = '';

    if (c.components != undefined) {
        c.components = uniqEs6(c.components);
        c.components.map(imp => {
            imports += 'import ' + imp + '  from "./' + imp + '";\n';
            comps += imp + ',\n\t';
        })
    }
    //--------------------render template---------------------------
    let template = render(c);
    let html = `<template>
\t${template}
</template>

<script>
${imports}

export default {
    mixins:[],
    data(){
      return {

      }
    },
    methods:{},
    computed:{},
    watch:{},
    beforeCreate(){},
    created() {},
    beforeMount(){},
    mounted() {},
    beforeUpdate(){},
    updated(){},
    beforeDestroy(){},
    destroyed() {},
    components:{
      ${comps}
    },
}
</script>

<style scoped>
</style>
`;

    return html;
}

function toHtmljs(c) {
    let imports = '';
    let comps = '';

    if (c.components != undefined) {
        c.components = uniqEs6(c.components);
        c.components.map(imp => {
            imports += 'import ' + imp + '  from "./' + imp + '";\n';
            comps += imp + ',\n\t';
        })
    }
    //--------------------render template---------------------------
    let template = render(c);
    let html = `${imports}
export default {
    template:\`
    \t${template }
    \`,
    mixins:[],
    data(){
      return {

      }
    },
    methods:{},
    computed:{},
    watch:{},
    beforeCreate(){},
    created() {},
    beforeMount(){},
    mounted() {},
    beforeUpdate(){},
    updated(){},
    beforeDestroy(){},
    destroyed() {},
    components:{
      ${comps}
    },
}
`;
    return html;
}

function htmlToReactComponentsLib(tree, options) {
    // console.log('options-->', options);
    var components = []
    var delimiter = options.moduleFileNameDelimiter || ""
    api.walk.bind(tree)(collectComponents(components))
    let coms = [];
    components = components.map(c => {
        let json = JSON.stringify(c);
        c = JSON.parse(json);
        c.components = [];
        if (c.attrs && c.attrs['data-component']) {
            c.cname = c.attrs['data-component'];
            delete c.attrs['data-component'];
        }

        if (c.content != undefined) {
            c.content = c.content.map(ct => {
                return removedataTag(ct, c);
            })
        }
        c.json = JSON.stringify(c);


        if (options.componentType == 'es6') {
            c.html = toHtmljs(c);
        } else {
            c.html = toHtmlvue(c);
        }
        coms.push(c);
        return c;
    });

    let cs = {};
    components.map(c => {
        cs[c.cname] = c;
        return c;
    })

    components = [];
    Object.keys(cs).map(c => {
        components.push(cs[c]);
    })
    return components;
}

module.exports = htmlToReactComponentsLib