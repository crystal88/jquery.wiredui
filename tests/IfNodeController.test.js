module("IfNodeController tests");
/**/
test("basic if", function() {
	var data = $.observable({
		a: true
	});
	var ctrl = $.wiredui.buildController("<div>{{if a}}true{{else}}false{{/if}}</div>", data);
	ctrl.render();
	
	same(ctrl.childNodes[0].childNodes.length, 1);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "true");
	
	data().a(false)
	same(ctrl.childNodes[0].childNodes.length, 1);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "false");
	
});

/**/
test("if-elseif-else", function() {
	var data = $.observable({a: 1});
	var ctrl = $.wiredui.buildController("<div>{{if a == 1}}one"
			+ "{{elseif a == 2}}two"
			+ "{{elif a == 3}}three"
			+ "{{else}}who knows?{{/if}}</div>", data);
			
	ctrl.render();
	same(ctrl.childNodes[0].childNodes.length, 1)
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "one");
	data().a(2);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "two");
	data().a(3);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "three");
	data().a(4);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "who knows?");
});
/**/
