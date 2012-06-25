module("NodeController");
/**/
test("OutputNode syntax tree", function() {
	
	var ctrl = $.wiredui.buildController("<div1><span>txt${txt}</span><p></p></div1>", {
		"var1": 1
	});
	
	same(1, ctrl.childNodes[0].childNodes[0].childNodes.length);
	same("#text", ctrl.childNodes[0].childNodes[0].childNodes[0].nodeName);
	same("txt", ctrl.childNodes[0].childNodes[0].childNodes[0].nodeValue);
	
	same(1, ctrl.childNodeControllers.length);
	var childCtrl = ctrl.childNodeControllers[0].nodeController;
	var pos = ctrl.childNodeControllers[0].position;
	same(1, pos.idx);
	same(ctrl.childNodes[0].childNodes[0], pos.parentElem);
	same(childCtrl.parentController, ctrl);
	
});
/**/
test("If syntax tree", function() {
	
	var ctrl = $.wiredui.buildController("<div1>{{if true}}beforeSpan<span>beforeOut${a}</span>afterSpan{{/if}}</div1>", {
		a: 'aa'
	});

	same(ctrl.childNodes.length, 1);
	same(ctrl.childNodes[0].nodeName, "div1")
	
	same(ctrl.childNodeControllers.length, 1);
	
	var ifCtrl = ctrl.childNodeControllers[0].nodeController;
	var ifPos = ctrl.childNodeControllers[0].position;
	
	same(ifPos.idx, 0);
	same(ifPos.parentElem, ctrl.childNodes[0])
	
	same(ifCtrl.childNodes.length, 3);
	same(ifCtrl.childNodes[0].nodeName, "#text");
	same(ifCtrl.childNodes[0].nodeValue, "beforeSpan");
	
	same(ifCtrl.childNodes[1].nodeName, "span");
	same(ifCtrl.childNodes[1].childNodes.length, 1);
	
	same(ifCtrl.childNodes[2].nodeName, "#text");
	same(ifCtrl.childNodes[2].nodeValue, "afterSpan");
	
	same(ifCtrl.childNodeControllers.length, 1);
	
	var outCtrl = ifCtrl.childNodeControllers[0].nodeController;
	var outPos = ifCtrl.childNodeControllers[0].position;
	
	same(outCtrl.parentController, ifCtrl);
	same(outPos.idx, 1);
	same(outPos.parentElem, ifCtrl.childNodes[1]);
});

test("ElseIf - Else syntax tree", function() {
	
	var ctrl = $.wiredui.buildController("<div1>{{if true}}<span>if</span>"
		+ "{{elseif true}}<span>elseif${elif}</span>"
		+ "{{else}}<span>else</span>{{/if}}</div1>", $.observable({}));
		
	same(ctrl.childNodeControllers.length, 1);
	
	var ifCtrl = ctrl.childNodeControllers[0].nodeController;
	var ifPos = ctrl.childNodeControllers[0].position;
	
	same(ifCtrl.childNodes.length, 1);
	same(ifCtrl.childNodes[0].nodeName, "span");
	same(ifCtrl.childNodes[0].childNodes[0].nodeValue, "if");
	
	same(ifCtrl.elseIfNodes.length, 1);
	
	var elseIfCtrl = ifCtrl.elseIfNodes[0];
	same(elseIfCtrl.childNodes.length, 1);
	same(elseIfCtrl.childNodes[0].nodeName, "span");
	same(elseIfCtrl.childNodes[0].childNodes[0].nodeValue, "elseif");
	
	var elseIfOutCtrl = elseIfCtrl.childNodeControllers[0].nodeController;
	ok(elseIfOutCtrl instanceof $.wiredui.OutputNodeController);
	
	var elseCtrl = ifCtrl.elseNode;
	same(elseCtrl.childNodes.length, 1);
	same(elseCtrl.childNodes[0].nodeName, "span");
	same(elseCtrl.childNodes[0].childNodes[0].nodeValue, "else");
	
});

test("Each syntax trees", function() {
	var ctrl = $.wiredui.buildController("<div1>{{each arr as idx=>elem}}<span>${idx}</span>"
		+ "<span>${elem}</span>{{/each}}</div1>", $.observable({}));
		
	same(ctrl.childNodes.length, 1);
	same(ctrl.childNodes[0].childNodes.length, 0);
		
	same(ctrl.childNodeControllers.length, 1);
	
	var eachCtrl = ctrl.childNodeControllers[0].nodeController;
	ok(eachCtrl instanceof $.wiredui.EachNodeController);
	
	same(eachCtrl.collVarName, "arr");
	same(eachCtrl.idxVarName, "idx");
	same(eachCtrl.valVarName, "elem");
	
});

test("NodeController.render()", function() {
		var ctrl = $.wiredui.buildController("<div><span/></div>");
		var DOM = ctrl.render();
		
		same(DOM.length, 1);
		same(DOM[0].tagName, "DIV");
		same(DOM[0].childNodes.length, 1);
		same(DOM[0].childNodes[0].tagName, "SPAN");
});

test("OutputNodeController.render()", function() {
	var data = $.observable({
		xx: "xx",
		yy: {
			aa: "aa"
		}
	});
	var ctrl = $.wiredui.buildController("<div>${xx}<span>${yy.aa}</span></div>", data);
	
	var DOM = ctrl.render();
	same(DOM[0].childNodes[0].nodeValue, "xx");
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "aa");
	
	same(data().yy().aa.listenerCount("change"), 1);
	same(data().yy.listenerCount("change"), 1);
	data().yy().aa("newaa")
	
	same(DOM[0].childNodes[1].childNodes.length, 1)
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "newaa");
	
	data().yy({aa : "aa in new yy"});
	same(data().yy().aa.listenerCount("change"), 1)
});

test("NodeController.prepareRunID()", function() {
	var ctrl = $.wiredui.buildController("<ul>{{each users as user}}<li>${user.name}{{if user.showEmail}} <i>(${user.email})</i>{{/if}}</li>{{/each}}</ul>", $.observable({users: []}));
	var rootNodes = ctrl.prepareRunID("test").childNodes;
	
	same(rootNodes.length, 1);
	same(rootNodes[0].nodeName, "UL");
	same(ctrl.childNodeControllers[0].visibleElems["test"].parentElem, rootNodes[0]);
});

test("NodeController.removeListener()", function() {
	var data = $.observable( {a: "a", b: "b"} );
	
	var listenerID1 = data().a.on("change", function() {});
	// TODO
});

test("Child NodeController DOM positioning", function() {
	var data = $.observable({aa:"aa", bb:"bb", cc:"cc", dd:"dd"});
	var ctrl = $.wiredui.buildController("<div><span1/>${aa}<span2/>"
		+ "${bb}<span3/><span4/>"
		+ "${cc}"
		+ "{{if true}}y${aa}x{{/if}}"
		+ "</div>", data);
	
	var DOM = ctrl.render();
	same(DOM[0].childNodes[1].nodeValue, "aa")
	same(DOM[0].childNodes[3].nodeValue, "bb")
	same(DOM[0].childNodes[6].nodeValue, "cc")
	same(DOM[0].childNodes[7].nodeValue, "y")
	same(DOM[0].childNodes[8].nodeValue, "aa")
	same(DOM[0].childNodes[9].nodeValue, "x")
	console.log(DOM)
	
	data().aa("aa-mod");
	same(DOM[0].childNodes[1].nodeValue, "aa-mod")
	same(DOM[0].childNodes[8].nodeValue, "aa-mod")
});
/**/

test("Child-NodeController DOM positioning in plaintext env", function() {
	var data = $.observable({
		user: {name: "main user", email: "mainuser@example.org"},
		users: [
			{name: "user1", showEmail: true, email: "user1@example.org"},
			{name: "user2", showEmail: false, email: "user2@example.org"},
			{name: "user3", showEmail: false, email: "user3@example.org"},
			{name: "user4", showEmail: true, email: "user4@example.org"},
			{name: "user5", showEmail: false, email: "user5@example.org"}
		]
	});
	var ctrl = $.wiredui.buildController("<div>hello ${user.name}"
		+ "all users:"
		+ "{{each users as idx => user}}"
		+ 	"{{if user.showEmail }}"
		+ 		"email: ${user.email}"
		+ 	"{{/if}}"
		+ 	"${idx + 1}. name: ${user.name}"
		+ "{{/each}}"
		+ "your email: ${user.email}</div>", data);
		
	var div = ctrl.render()[0];

	var expected = ["hello ", "main user", "all users:"
		, "email: ", "user1@example.org", "1", ". name: ", "user1"
		, "2", ". name: ", "user2"
		, "3", ". name: ", "user3"
		, "email: ", "user4@example.org", "4", ". name: ", "user4"
		, "5", ". name: ", "user5"
		, "your email: ", "mainuser@example.org"];
	
	for (var i = 0; i < expected.length; ++i) {
		same(div.childNodes[ i ].nodeValue, expected[ i ]);
	}
	
	// validating internal data structure
	same(ctrl.childNodeControllers.length, 3)
	ok(ctrl.childNodeControllers[0].nodeController instanceof $.wiredui.OutputNodeController)
	ok(ctrl.childNodeControllers[1].nodeController instanceof $.wiredui.EachNodeController)
	ok(ctrl.childNodeControllers[2].nodeController instanceof $.wiredui.OutputNodeController)
	
	var outChild1 = ctrl.childNodeControllers[0];
	same(outChild1.visibleElems.length, 1)
	same(outChild1.visibleElems[0].elems[0], div.childNodes[1]);
	
	var eachChild = ctrl.childNodeControllers[1];
	same(eachChild.visibleElems.length, 1);
	same(eachChild.visibleElems[0].elems.length, 19);
	
	same(eachChild.nodeController.childNodeControllers.length, 3);
	ok(eachChild.nodeController.childNodeControllers[0].nodeController instanceof $.wiredui.IfNodeController);
	
	var ifChild = eachChild.nodeController.childNodeControllers[0];
	same(ifChild.nodeController.childNodeControllers.length, 1)
	var ifoutChild = ifChild.nodeController.childNodeControllers[0];
	var expectedKeys = ["0;0", "0;1", "0;2", "0;3", "0;4"];
	for (var i in expectedKeys) {
		ok(ifChild.visibleElems[ expectedKeys[i] ] !== undefined)
	}
	
	var texts = div.childNodes;
	same(ifChild.visibleElems["0;0"].elems.length, 2);
	same(ifChild.visibleElems["0;0"].elems[0], texts[3]);
	same(ifChild.visibleElems["0;0"].elems[0].nodeValue, "email: ");
	same(ifChild.visibleElems["0;0"].elems[1], texts[4]);
	same(ifChild.visibleElems["0;0"].elems[1].nodeValue, "user1@example.org");
	
	same(ifoutChild.visibleElems["0;0"].elems.length, 1);
	same(ifoutChild.visibleElems["0;0"].elems[0].nodeValue, "user1@example.org");
	
	same(ifChild.visibleElems["0;1"].elems.length, 0);
	same(ifChild.visibleElems["0;2"].elems.length, 0);
	
	same(ifChild.visibleElems["0;3"].elems.length, 2);
	same(ifChild.visibleElems["0;3"].elems[0], texts[14]);
	same(ifChild.visibleElems["0;3"].elems[0].nodeValue, "email: ");
	same(ifChild.visibleElems["0;3"].elems[1], texts[15]);
	same(ifChild.visibleElems["0;3"].elems[1].nodeValue, "user4@example.org");
	
	same(ifoutChild.visibleElems["0;3"].elems[0].nodeValue, "user4@example.org");
	
	same(ifChild.visibleElems["0;4"].elems.length, 0);
	
	same(ctrl.getIdxShiftFor("0", div, eachChild), 3);
	
	same(eachChild.nodeController.getIdxShiftFor("0;0", null, ifChild), 0);
	
	same(eachChild.nodeController.getIdxShiftFor("0;1", null, ifChild), 4);
	
	console.log(div);
	//console.log(ctrl);
	return;
	data().users(3)().email("user4-mod@example.org");
	
	var expected = ["hello ", "main user", "all users:"
		, "email: ", "user1@example.org", "1", ". name: ", "user1"
		, "2", ". name: ", "user2"
		, "3", ". name: ", "user3"
		, "email: ", "user4-mod@example.org", "4", ". name: ", "user4"
		, "5", ". name: ", "user5"
		, "your email: ", "mainuser@example.org"];
	
	for (var i = 0; i < expected.length; ++i) {
		same(div.childNodes[ i ].nodeValue, expected[ i ]);
	}
	
});

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
