
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
            if(typeof sel == "string"){
                this.sel = sel;
                this.doms = document.querySelectorAll(sel);
                this.length = this.doms.length;
            }else{// dom이 직접 들어올 경우
                this.doms = [sel];
                this.length = 1;
            }
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

            if(typeof value === "number"){
                value = value + "px";
            }

            this.doms.forEach(function(dom){
                dom.style[name] = value;
            });

            return this;
        },


        position : function() {
            var top = this.doms[0].style["top"];
            top = Number(top.substring(0, top.length-2));

            var left = this.doms[0].style["left"];
            left = Number(left.substring(0, left.length-2));

            return {"top" : top, "left" : left};
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


        removeAttr : function(name) {
            if(this.length == 0) return;

            this.doms.forEach(function(dom){
                dom.removeAttribute(name);
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
            this.doms[0].focus();
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

    $m._curry = function(fn){
        return function(a,b){
            return arguments.length === 2 ? fn(a,b) : b => fn(a,b);
        }
    };

    $m._curryr = function(fn){
        return function(a,b){
            return arguments.length === 2 ? fn(a,b) : b => fn(b,a);
        }
    };


    $m._each = $m._curryr(function(list, fn) {
        if(typeof list !==  "object" || !list){
            return [];
        }
        var keys = Object.keys(list);
        for(var i=0; i<keys.length; i++){
            fn(list[keys[i]], keys[i], list);
        }
        return list;
    });

    $m._map = $m._curryr(function(list, mapper){
        var res = [];
        $m._each(list, function(val, key, list){
            res.push(mapper(val, key, list));
        });
        return res;
    });

    $m._filter = $m._curryr(function(list, predi){
        var res = [];
        $m._each(list, function(val, key, list){
            if(predi(val, key, list)){
                res.push(val);
            }
        });
        return res;
    });


    $m._reduce = function(list, iter, init){
        var res = init;
        if(init === undefined){
            res = list && list[0];      // null 체크
            list = list && list.slice(1);
        }
        $m._each(list, function(val, key, list){
                res = iter(val, res, key, list);
        });
        return res;
    };






    return $m;
});

