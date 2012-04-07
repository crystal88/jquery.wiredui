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


test("2-dimensional foreach testing", function() {
	var data = $.observable({
		users: [{
			name: "user1",
			showEmail: true,
			email: "user1@example.org",
			friends: [
				{name: "user1-friend1"},
				{name: "user1-friend2"},
				{name: "user1-friend3"}
			]
		}, {
			name: "user2",
			showEmail: false,
			email: "user2@example.org",
			friends: [
				{name: "user2-friend1"},
				{name: "user2-friend2"},
			]
		}, {
			name: "user3",
			showEmail: false,
			email: "user3@example.org",
			friends: [
				{name: "user3-friend1"},
				{name: "user3-friend2"},
				{name: "user3-friend3"},
				{name: "user3-friend4"},
			]
		}, {
			name: "user4",
			showEmail: true,
			email: "user4@example.org",
			friends: []
		}, {
			name: "user5",
			showEmail: false,
			email: "user5@example.org",
			friends: [
				{name: "user5-friend1"},
				{name: "user5-friend2"}
			]
		}
		]
	});
	
	var ctrl = $.wiredui.buildController("<div><h1>Users: </h1>"
	 + "{{each users as idx => user}}"
		+ "name: ${user.name}"
		+ "{{if user.showEmail}}<i>(${user.email})</i>{{/if}}"
		+ "friends: <ul>"
		+ "{{each user.friends as user}}"
			+ "<li>${user.name}</li>"
		+ "{{/each}}"
		+ "</ul>"
	 + "{{/each}}"
	 + "</div>", data);
	 
	var div = ctrl.render()[0];
	console.log(div);
	
	var expected = [
		{nodeName: "H1", childNodes: [
			"Users: "
		]},
		"name: ",
		"user1",
		{
			nodeName: "I",
			childNodes: [
				"(", "user1@example.org", ")"
			]
		},
		"friends: ",
		{
			nodeName: "UL",
			childNodes: [
				{nodeName: "LI", childNodes: ["user1-friend1"]},
				{nodeName: "LI", childNodes: ["user1-friend2"]},
				{nodeName: "LI", childNodes: ["user1-friend3"]}
			]
		},
		"name: ",
		"user2",
		"friends: ",
		{
			nodeName: "UL",
			childNodes: [
				{nodeName: "LI", childNodes: ["user2-friend1"]},
				{nodeName: "LI", childNodes: ["user2-friend2"]}
			]
		},
		"name: ",
		"user3",
		"friends: ",
		{
			nodeName: "UL",
			childNodes: [
				{nodeName: "LI", childNodes: ["user3-friend1"]},
				{nodeName: "LI", childNodes: ["user3-friend2"]},
				{nodeName: "LI", childNodes: ["user3-friend3"]},
				{nodeName: "LI", childNodes: ["user3-friend4"]}
			]
		},
		"name: ",
		"user4",
		{
			nodeName: "I",
			childNodes: ["(", "user4@example.org", ")"]
		},
		"friends: ",
		{
			nodeName: "UL",
			childNodes: []
		},
		"name: ",
		"user5",
		"friends: ",
		{
			nodeName: "UL",
			childNodes: [
				{nodeName: "LI", childNodes: ["user5-friend1"]},
				{nodeName: "LI", childNodes: ["user5-friend2"]}
			]
		}
	];
	
	var assertNodeListEquals = function(actual, expected) {
		same(actual.length, expected.length);
		for (var i = 0; i < actual.length; ++i) {
			var actElem = actual[i];
			var expElem = expected[i];
			if (actElem === undefined || expElem === undefined) {
				ok(false); break;
			}
			if (actElem.nodeName == "#text") {
				same(actElem.nodeValue, expElem);
			} else {
				same(actElem.nodeName, expElem.nodeName);
			}
			
			if (actElem.attributes) {
				for (var j = 0; j < actElem.attributes.length; ++i) {
					same(actElem.attributes[j].name, expElem.attributes[j].name);
					same(actElem.attributes[j].value, expElem.attributes[j].value);
				}
			}
			
			if (actElem.childNodes && expElem.childNodes) {
				assertNodeListEquals(actElem.childNodes, expElem.childNodes);
			}
		}
	}
	
	assertNodeListEquals(div.childNodes, expected);
});
