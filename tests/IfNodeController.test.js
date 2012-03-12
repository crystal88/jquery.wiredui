module("IfNodeController tests");

test("basic if", function() {
	var data = $.observable({
		a: true
	});
	var ctrl = $.wiredui.buildController("<div>{{if a}}true{{else}}false{{/if}}</div>", data);
	console.log(ctrl);
	ctrl.render();
	
	same(ctrl.childNodes[0].childNodes.length, 1);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "true");
	
	data().a(false)
	same(ctrl.childNodes[0].childNodes.length, 1);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "false");
	
});
