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
test("each - idx and val", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org", showEmail: false},
			{name: "user2", email: "user2@example.org", showEmail: false}
		]
	});
	var ctrl = $.wiredui.buildController("<ul>{{each users as idx => user}}<li>${idx + 1}. user:\
				${user.name} {{if user.showEmail}}<i>${user.email}</i>{{/if}}</li>{{/each}}</ul>", data);

	var DOM = ctrl.render();
	console.log(DOM);
	
	same(DOM[0].childNodes.length, 2);
	same(DOM[0].childNodes[0].childNodes.length, 4);
	same(DOM[0].childNodes[0].childNodes[0].nodeValue, "1");
	same(DOM[0].childNodes[0].childNodes[2].nodeValue, "user1");
	
	same(DOM[0].childNodes[1].childNodes.length, 4);
	same(DOM[0].childNodes[1].childNodes[0].nodeValue, "2");
	same(DOM[0].childNodes[1].childNodes[2].nodeValue, "user2");
	
	
	data().users(1)().showEmail(true);
	same(DOM[0].childNodes[1].childNodes.length, 5);
	same(DOM[0].childNodes[1].childNodes[4].childNodes[0].nodeValue, 'user2@example.org')
	
	data().users(0)().showEmail(true);
	same(DOM[0].childNodes[0].childNodes.length, 5);
	var iTag = DOM[0].childNodes[0].childNodes[4];
	same(iTag.nodeName, "I");
	same(iTag.childNodes[0].nodeValue, "user1@example.org")

	data().users(1)().email('user2@example.com')
	same(DOM[0].childNodes[1].childNodes[4].childNodes[0].nodeValue, 'user2@example.com')
	
});

test("proper scope handling", function() {
	var data = $.observable({
		users: [
			{name: "user1", email: "user1@example.org"},
			{name: "user2", email: "user2@example.org"}
		],
		user: {name: "u"},
		idx: "idx-out"
	});
	var ctrl = $.wiredui.buildController("<div>"
		+ "<span>${user.name}</span>"
		+ "{{each users as idx => user}}"
		+ 	"${idx + 1}${user.name}"
		+ "{{/each}}"
		+ "<span2>${idx}${user.name}</span2></div>", data);
	var DOM = ctrl.render();
	console.log(DOM)
	same(DOM[0].childNodes[0].childNodes[0].nodeValue, "u");
	same(DOM[0].childNodes[1].nodeValue, "1");
	same(DOM[0].childNodes[2].nodeValue, "user1");
	same(DOM[0].childNodes[3].nodeValue, "2");
	same(DOM[0].childNodes[4].nodeValue, "user2");
	same(DOM[0].childNodes[5].childNodes[0].nodeValue, "idx-out");
	same(DOM[0].childNodes[5].childNodes[1].nodeValue, "u");
	
	// TODO data().users(1)( {name : "user2-mod"} );
	data().users(1)().name("user2-mod");
	
	same(DOM[0].childNodes[4].nodeValue, "user2-mod");
});
