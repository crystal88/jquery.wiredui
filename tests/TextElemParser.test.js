module("TextNodeParser");
/**/
function tokens(str) {
	var stream = new $.wiredui.TextElemParser(str);
	return stream.readAll();
}

test("Reading plain HTML", function(){
	var stream = new $.wiredui.TextElemParser("foo<bar/>");
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

test("Output token reading", function() {
	var a = tokens("${a}");
	same(a, [{
		type: 'output',
		token: "a"
	}], "single token reading works");
	a = tokens("${a}html");
	same(a, [{
		type: 'output',
		token: 'a'
	}, {
		type: 'html',
		token: 'html'
	}], "output > html");
	a = tokens("h1${a}h2${bb}");
	same(a, [{
		type: 'html',
		token: 'h1'
	}, {
		type: 'output',
		token: 'a'
	}, {
		type: 'html',
		token: 'h2'
	}, {
		type: 'output',
		token: 'bb'
	}], "html > output > html > output");
});


test("Statement token reading", function() {
	var a = tokens("{{foo bar}}");
	same(a, [{
		type: 'stmt',
		token: 'foo bar'
	}], "testing single token reading");
	
	a = tokens("{{foo < bar.user}} hey");
	same(a, [{
		type: 'stmt',
		token: 'foo < bar.user'
	}, {
		type: 'html',
		token: ' hey'
	}], "stmt > html");
	
	a = tokens("hooray {{foo < bar.user}} hey{{ aa }}");
	same(a, [{
		type: 'html',
		token: 'hooray '
	}, {
		type: 'stmt',
		token: 'foo < bar.user'
	}, {
		type: 'html',
		token: ' hey'
	}, {
		type: 'stmt',
		token: 'aa'
	}], "html > stmt > html > stmt");
});
/**/
