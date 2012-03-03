module("NodeController");

test("hello", function() {
	
	var ctrl = $.wiredui.buildController("<div1><span>txt${txt}</span><p></p></div1>", {
		"var1": 1
	});
	
	same(2, ctrl.childNodes[0].childNodes[0].childNodes.length);
	same("#text", ctrl.childNodes[0].childNodes[0].childNodes[0].nodeName);
	same("txt", ctrl.childNodes[0].childNodes[0].childNodes[0].nodeValue);
	
});

