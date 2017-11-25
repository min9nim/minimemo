
Function.prototype.method = function(name, func){
    this.prototype[name] = func;
    return this;
};

Function.method("new", function () {
    var that = Object.create(this.prototype);
    var other = this.apply(that, arguments);
    return (typeof other === "object" && other) || that;
});


if ( typeof Object.create !== "function") {
    Object.create = function(o){
        var F = function(){};
        F.prototype = o;
        return new F();
    };
}


//http://www.mojavelinux.com/articles/javascript_hashes.html
function HashTable(obj)
{
    this.length = 0;
    this.items = {};
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            this.items[p] = obj[p];
            this.length++;
        }
    }

    this.setItem = function(key, value)
    {
        var previous = undefined;
        if (this.hasItem(key)) {
            previous = this.items[key];
        }
        else {
            this.length++;
        }
        this.items[key] = value;
        return previous;
    }

    this.getItem = function(key) {
        return this.hasItem(key) ? this.items[key] : undefined;
    }

    this.hasItem = function(key)
    {
        return this.items.hasOwnProperty(key);
    }

    this.removeItem = function(key)
    {
        if (this.hasItem(key)) {
            previous = this.items[key];
            this.length--;
            delete this.items[key];
            return previous;
        }
        else {
            return undefined;
        }
    }

    this.keys = function()
    {
        var keys = [];
        for (var k in this.items) {
            if (this.hasItem(k)) {
                keys.push(k);
            }
        }
        return keys;
    }

    this.values = function()
    {
        var values = [];
        for (var k in this.items) {
            if (this.hasItem(k)) {
                values.push(this.items[k]);
            }
        }
        return values;
    }


    this.getArray = function()
    {
        var arr = [];
        for (var k in this.items) {
            if (this.hasItem(k)) {
                var item = {};
                item.key = k;
                item.val = this.items[k];
                arr.push(item);
            }
        }
        return arr;
    }


    this.each = function(fn) {
        for (var k in this.items) {
            if (this.hasItem(k)) {
                fn(k, this.items[k]);
            }
        }
    }


    this.clear = function()
    {
        this.items = {}
        this.length = 0;
    }
}


define([],function(){
    $m = function(sel){
        return new $m.fn.init(sel);
    };

    $m.fn = {
        init :  function(sel){
            this.sel = sel;
            this.doms = document.querySelectorAll(sel);
            this.length = this.doms.length;
        },

        html : function (html) {
            if(html === undefined){
                return this.doms[0].innerHTML;
            }

            this.doms.forEach(function (dom) {
                dom.innerHTML = html;
            });

            return this;
        },

        css : function(name, value) {
            if(value === undefined){
                return this.doms[0].style[name];
            }

            this.doms.forEach(function(dom){
                dom.style[name] = value;
            });

            return this;
        },

        attr : function(name, value) {
            if(value === undefined){
                return this.doms[0].getAttribute(name);
            }

            this.doms.forEach(function(dom){
                dom.setAttribute(name, value);
            });

            return this;
        },

        addClass : function(name) {
            this.doms.forEach(function(dom){
                var cls = dom.getAttribute("class");
                //cls = cls.split(" ").push(name).join(" ");
                cls = cls + " " + name;
                dom.setAttribute("class", cls);
            });

            return this;
        },


        removeClass : function(name) {
            this.doms.forEach(function(dom){
                var cls = dom.getAttribute("class");
                var arr = cls.split(" ");
                var idx = arr.indexOf(name);
                if(idx < 0){
                    return;
                }
                arr.splice(idx, 1);
                dom.setAttribute("class", arr.join(" "));
            });

            return this;
        },

        each : function(func) {
            this.doms.forEach(function(val, key, arr){
                func.call(val, val, key, arr);
            });

            return this;
        },

        remove : function(){
            this.doms.forEach(function(dom){
                dom.parentNode.removeChild( dom );
            });
        },

        append : function(elem){
            this.doms.forEach(function(dom){
                if ( dom.nodeType === 1 || dom.nodeType === 11 || dom.nodeType === 9 ) {
                    dom.appendChild($m.clone(elem));
                }
            });
            return this;
        },

        prepend : function(elem){
            this.doms.forEach(function(dom){
                if ( dom.nodeType === 1 || dom.nodeType === 11 || dom.nodeType === 9 ) {
                    dom.insertBefore($m.clone(elem), dom.firstChild);
                }
            });
            return this;
        },

        show : function(){
            this.doms.forEach(function(dom){
                dom.style.display = "";
            });
            return this;
        },

        hide : function(){
            this.doms.forEach(function(dom){
                dom.style.display = "none";
            });
            return this;
        },

        val : function(value){
            if(value === undefined){
                return this.doms[0].value;
            }

            this.doms.forEach(function(dom){
                dom.value = value;
            });

            return this;
        },

        focus : function(){

        }

    };

    $m.fn.init.prototype = $m.fn;

    $m.clone = function(elem){
        var newNode;
        if(typeof elem === "string"){
            var tmp = document.createElement("div");
            tmp.innerHTML = elem;
            newNode = tmp.firstChild;
        }else{
            newNode = elem.cloneNode(true);
        }
        return newNode;
    };

    $m.qs = function(sel) {
        return document.querySelector(sel);
    };

    $m.qsa = function(sel){
        return document.querySelectorAll(sel);
    };



    return $m;

});

