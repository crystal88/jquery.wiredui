function debug(str) {
	console.log(str);
}

function tokens(str) {
	var stream = new $.binddata.TokenStream(str);
	return stream.readAll();
}

module("TokenStream");

test("Reading plain HTML", function(){
	var stream = new $.binddata.TokenStream("foo<bar/>");
	var tokens = stream.readAll();
	same(tokens, [{
		type: 'html',
		token: "foo<bar/>"
	}], "one HTML token returned");
});
	
test("Properly handling special chars in HTML context", function()  {
	var a = tokens("f}o<o$ ba{r{");
	same(a, [{
		type: 'html',
		token: "f}o<o$ ba{r{"
	}], "properly handled");
});
