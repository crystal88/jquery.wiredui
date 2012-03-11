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
	
	same(eachCtrl.arrVarName, "arr");
	same(eachCtrl.idxVarName, "idx");
	same(eachCtrl.elemVarName, "elem");
	
});

test("NodeController.render()", function() {
		var ctrl = $.wiredui.buildController("<div><span/></div>");
		var DOM = ctrl.render();
		
		same(DOM.length, 1);
		same(DOM[0].tagName, "div");
		same(DOM[0].childNodes.length, 1);
		same(DOM[0].childNodes[0].tagName, "span");
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
	console.log(DOM);
	same(DOM[0].childNodes[0].nodeValue, "xx");
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "aa");
	
	same(data().yy().aa.__observable.eventlisteners["change"].length, 1);
	same(data().yy.__observable.eventlisteners["change"].length, 1);
	data().yy().aa("newaa")
	
	same(DOM[0].childNodes[1].childNodes.length, 1)
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "newaa");
	
	data().yy({aa : "aa in new yy"});
	same(data().yy().aa.__observable.eventlisteners["change"].length, 1)
});

test("Child NodeController DOM positioning", function() {
	var data = $.observable({aa:"aa", bb:"bb", cc:"cc"});
	var ctrl = $.wiredui.buildController("<div><span1/>${aa}<span2/>${bb}<span3/><span4/>${cc}</div>", data);
	
	ctrl.render();
	same(ctrl.childNodes[0].childNodes[1].nodeValue, "aa")
	same(ctrl.childNodes[0].childNodes[3].nodeValue, "bb")
	same(ctrl.childNodes[0].childNodes[6].nodeValue, "cc")
});
