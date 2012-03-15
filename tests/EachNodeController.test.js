module("EachNodeController tests");

test("Basic each", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org"},
			{name: "user2", email: "user2@example.org"}
		]
	});
	var ctrl = $.wiredui.buildController("<ul>{{each users as idx => user}}user{{/each}}</ul>", data);
	ctrl.render();
	
	same(ctrl.childNodes[0].childNodes.length, 2);
	same(ctrl.childNodes[0].childNodes[0].nodeValue, "user");
	same(ctrl.childNodes[0].childNodes[1].nodeValue, "user");
	
});

test("each - index variable", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org"},
			{name: "user2", email: "user2@example.org"}
		]
	});
	var ctrl = $.wiredui.buildController("<ul>{{each users as idx => user}}${idx}. user{{/each}}</ul>", data);
	var DOM = ctrl.render();
	console.log(DOM);
	
});
