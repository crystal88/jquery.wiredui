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
		literal: "foo<bar/>"
	}], "one HTML token returned");
});
	
test("Properly handling special chars in HTML context", function()  {
	var a = tokens("f}o<o$ ba{r{");
	same(a, [{
		type: 'html',
		literal: "f}o<o$ ba{r{"
	}], "properly handled");
});

test("Output token reading", function() {
	var a = tokens("${a}");
	same(a, [{
		type: 'output',
		literal: "a"
	}], "single token reading works");
	a = tokens("${a}html");
	same(a, [{
		type: 'output',
		literal: 'a'
	}, {
		type: 'html',
		literal: 'html'
	}], "output > html");
	a = tokens("h1${a}h2${bb}");
	same(a, [{
		type: 'html',
		literal: 'h1'
	}, {
		type: 'output',
		literal: 'a'
	}, {
		type: 'html',
		literal: 'h2'
	}, {
		type: 'output',
		literal: 'bb'
	}], "html > output > html > output");
});


test("Statement token reading", function() {
	var a = tokens("{{foo bar}}");
	same(a, [{
		type: 'stmt',
		literal: 'foo bar'
	}], "testing single token reading");
	
	a = tokens("{{foo < bar.user}} hey");
	same(a, [{
		type: 'stmt',
		literal: 'foo < bar.user'
	}, {
		type: 'html',
		literal: ' hey'
	}], "stmt > html");
	
	a = tokens("hooray {{foo < bar.user}} hey{{ aa }}");
	same(a, [{
		type: 'html',
		literal: 'hooray '
	}, {
		type: 'stmt',
		literal: 'foo < bar.user'
	}, {
		type: 'html',
		literal: ' hey'
	}, {
		type: 'stmt',
		literal: 'aa'
	}], "html > stmt > html > stmt");
});
/**/
