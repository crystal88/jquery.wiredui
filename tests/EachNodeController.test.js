module("EachNodeController tests");
/**/
test("Basic each", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org"},
			{name: "user2", email: "user2@example.org"}
		]
	});
	var ctrl = $.wiredui.buildController("<ul>{{each users as idx => user}}user{{/each}}</ul>", data);
	
	var ctrlDOM = ctrl.render();
	same(ctrlDOM[0].childNodes.length, 2);
	same(ctrlDOM[0].childNodes[0].nodeValue, "user");
	same(ctrlDOM[0].childNodes[1].nodeValue, "user");
	
});
/**/
test("each - index variable", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org"},
			{name: "user2", email: "user2@example.org"}
		]
	});
	var ctrl = $.wiredui.buildController("<ul>{{each users as idx => user}}<li>${idx + 1}. user</li>{{/each}}</ul>", data);
	var DOM = ctrl.render();
	
	same(DOM[0].childNodes.length, 2);
	same(DOM[0].childNodes[0].childNodes.length, 2);
	same(DOM[0].childNodes[0].childNodes[0].nodeValue, "1");
	
	same(DOM[0].childNodes[1].childNodes.length, 2);
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "2");
});
/**/
