module("Attribute binding");

test("hello world", function() {
    var data = $.observable({foo: "bar"});
    var ctrl = $.wiredui.buildController('<div attrib="${foo}" plainattr="text"></div>', data);
    var div = ctrl.render()[0];

    same(div.getAttribute("attrib"), "bar");
});

test("multiple outputs", function() {
    var data = $.observable({var1: "val1", var2: "val2"});
    var ctrl = $.wiredui.buildController('<div attrib="html1${var1}html2${var2}html3" plainattr="text"></div>', data);
    var div = ctrl.render()[0];

    same(div.getAttribute("attrib"), "html1val1html2val2html3");
});


test("output controller within foreach", function() {
    var data = $.observable({
        globalVar: "globalVal",
        items: [
            {
                var1 : "val11",
                var2 : "val12",
                var3 : "val13"
            },
            {
                var1 : "val21",
                var2 : "val22",
                var3 : "val23"
            },
            {
                var1 : "val31",
                var2 : "val32",
                var3 : "val33"
            }
        ]
    })

    var ctrl = $.wiredui.buildController('<div>{{each items as val}}<p attr="${val.var1} ${val.var2}">${val.var3}</p>{{/each}}</div>', data)
    var div = ctrl.render()[0];

    same("val11 val12", div.childNodes[0].getAttribute("attr"));
    same("val21 val22", div.childNodes[1].getAttribute("attr"));
    same("val31 val32", div.childNodes[2].getAttribute("attr"));

});

test("output variable updating", function() {
    var data = $.observable({
        myvar: "val"
    });
    var ctrl = $.wiredui.buildController('<div attr="${myvar}"></div>', data);
    var div = ctrl.render()[0];

    same("val", div.getAttribute('attr'));
    data().myvar('val-changed');
    same("val-changed", div.getAttribute('attr'));
});

test("IfNodeController in attribute", function() {
   var data = $.observable({
       condition: true
   });
   var ctrl = $.wiredui.buildController('<div attr="before{{if condition}}true{{else}}false{{/if}} after"></div>', data);
    console.log(ctrl);
    var div = ctrl.render();

    console.log(div);

});