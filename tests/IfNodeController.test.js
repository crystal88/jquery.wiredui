module("IfNodeController tests");

test("basic IF", function() {
	var data = $.observable({
		a: true
	});
	var ctrl = $.wiredui.buildController("<div>{{ if a }} true {{ else }} false {{ /if }}</div>", data);
	console.log(ctrl.childNodeControllers);
	console.log(ctrl.render());
	
	
});
