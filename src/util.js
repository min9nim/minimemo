
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
    var $m = function(sel){
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
            if(this.length === 1){
                this.dom = this.doms[0];
            }
        },

        html : function (html) {
            if(this.length == 0) return;

            if(html === undefined){
                return this.doms[0].innerHTML;
            }

            $m._each(this.doms, function (dom) {
                dom.innerHTML = html;
            });

            return this;
        },

        text : function (text) {
            if(this.length == 0) return;

            if(text === undefined){
                return this.doms[0].textContent;
            }

            $m._each(this.doms, function (dom) {
                dom.textContent = text;
            });

            return this;
        },

        css : function(name, value) {
            if(this.length == 0) return;

            if(value === undefined){
                return this.doms[0].style[name];
            }

            if(typeof value === "number"){
                var arr = ["left", "top", "right", "bottom", "width", "height"];
                if(arr.indexOf(name) >= 0){
                    value = value + "px";
                }
            }

            $m._each(this.doms, function(dom){
                dom.style[name] = value;
            });

            return this;
        },


        position : function() {
            if(this.length == 0) return;

            var top = this.doms[0].style["top"];
            top = Number(top.substring(0, top.length-2));

            var left = this.doms[0].style["left"];
            left = Number(left.substring(0, left.length-2));

            return {"top" : top, "left" : left};
        },

        parent : function(){

        },


        animate : function(){

        },

        bind : function(){

        },



        attr : function(name, value) {
            if(this.length == 0) return;

            if(value === undefined){
                return this.doms[0].getAttribute(name);
            }

            $m._each(this.doms, function(dom){
                dom.setAttribute(name, value);
            });

            return this;
        },


        removeAttr : function(name) {
            if(this.length == 0) return;

            $m._each(this.doms, function(dom){
                dom.removeAttribute(name);
            });

            return this;
        },

        addClass : function(name) {
            $m._each(this.doms, function(dom){
                var cls = dom.getAttribute("class");
                //cls = cls.split(" ").push(name).join(" ");
                cls = cls + " " + name;
                dom.setAttribute("class", cls);
            });

            return this;
        },


        removeClass : function(name) {
            $m._each(this.doms, function(dom){
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
            $m._each(this.doms, function(val, key, arr){
                func.call(val, val, key, arr);
            });

            return this;
        },

        remove : function(){
            $m._each(this.doms, function(dom){
                dom.parentNode.removeChild( dom );
            });
        },

        append : function(elem){
            $m._each(this.doms, function(dom){
                if ( dom.nodeType === 1 || dom.nodeType === 11 || dom.nodeType === 9 ) {
                    dom.appendChild($m.clone(elem));
                }
            });
            return this;
        },

        prepend : function(elem){
            $m._each(this.doms, function(dom){
                if ( dom.nodeType === 1 || dom.nodeType === 11 || dom.nodeType === 9 ) {
                    dom.insertBefore($m.clone(elem), dom.firstChild);
                }
            });
            return this;
        },

        show : function(){
            $m._each(this.doms, function(dom){
                dom.style.display = "block";
            });
            return this;
        },

        hide : function(){
            $m._each(this.doms, function(dom){
                dom.style.display = "none";
            });
            return this;
        },

        val : function(value){
            if(this.length == 0) return;

            if(value === undefined){
                return this.doms[0].value;
            }

            $m._each(this.doms, function(dom){
                dom.value = value;
            });

            return this;
        },

        focus : function(){
            if(this.length == 0) return;

            this.doms[0].focus();
        }

    };

    $m.fn.init.prototype = $m.fn;


    // 유틸
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

    $m.scrollTo = function(x, y){
        window.scrollTo(x,y);
    };


    // 함수형 프로그래밍 라이브러리
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

    $m._slice = function(list, begin, end){
        if(typeof arguments[0] === "number"){
            var begin = arguments[0];
            var end = arguments[1];
            return function(list){
                return Array.prototype.slice.call(list, begin, end);
            };
        }else{
            return Array.prototype.slice.call(list, begin, end);
        }
    };

    $m._go = function () {
        var args = arguments;
        var fns = $m._slice(args, 1);
        return $m._pipe(fns)(args[0]);
    };

    $m._pipe = function () {
        var fns = Array.isArray(arguments[0]) ? arguments[0] : arguments;
        return function(){
            return $m._reduce(fns, function(val, res, key, list){
                return val(res);
            }, arguments[0]);
        }
    };



    return $m;
});

