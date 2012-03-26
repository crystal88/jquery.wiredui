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
	same(ctrl.childNodeControllers[0].lastCreatedElems["test"].parentElem, rootNodes[0]);
});

test("NodeController.removeListener()", function() {
	var data = $.observable( {a: "a", b: "b"} );
	
	var listenerID1 = data().a.on("change", function() {});
	// TODO
});

test("Child NodeController DOM positioning", function() {
	var data = $.observable({aa:"aa", bb:"bb", cc:"cc", dd:"dd"});
	var ctrl = $.wiredui.buildController("<div><span1/>${aa}<span2/>${bb}<span3/><span4/>${cc}{{if true}} ${aa} {{/if}}</div>", data);
	
	var DOM = ctrl.render();
	same(DOM[0].childNodes[1].nodeValue, "aa")
	same(DOM[0].childNodes[3].nodeValue, "bb")
	same(DOM[0].childNodes[6].nodeValue, "cc")
});
/**/
