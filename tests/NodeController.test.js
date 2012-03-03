module("NodeController");

test("hello", function() {
	
	var ctrl = $.binddata.buildController("<div1><span>${var1}</span><p></p></div1>", {
		"var1": 1
	});
	
	same("${var1}", ctrl.childNodes[0].childNodes[0].childNodes[0].nodeValue);
	
});

