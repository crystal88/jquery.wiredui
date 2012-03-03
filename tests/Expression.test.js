module("Expressions");

test("literals", function() {
	var expr = new $.binddata.Expression(" (null ) ");
	same(null, expr.evaluate(), "null works");
	expr = new $.binddata.Expression(" 'hey'");
	same('hey', expr.evaluate(), "''string works");
	expr = new $.binddata.Expression(' "hey" ');
	same('hey', expr.evaluate(), '"" string works');
	
	expr = new $.binddata.Expression("-2.45");
	same(-2.45, expr.evaluate(), "number works");
	
	expr = new $.binddata.Expression("true");
	same(true, expr.evaluate(), "boolean true works");
	
	expr = new $.binddata.Expression("false");
	same(false, expr.evaluate(), "boolean false works");
})

test("variables", function() {
	var data = $.observable({myvar: 'myval'});
	var expr = new $.binddata.Expression("myvar");
	
	data().myvar("changed");
	same('changed', expr.evaluate(data)(), "simple variable")
	
	data = $.observable({
		myobj: {
			mystr: "hey"
		}
	});
	expr = new $.binddata.Expression("myobj.mystr");
	same('hey', expr.evaluate(data)(), "object property");
	
	expr = new $.binddata.Expression("non.exis.tent");
	same(undefined, expr.evaluate(data), "handling non-existent property correctly");
})

test("unary operators", function() {
	var expr = new $.binddata.Expression("! false");
	same(true, expr.evaluate({}), "! works");
	
	var expr = new $.binddata.Expression("not ((false))");
	same(true, expr.evaluate({}), "'not' works");
	
	var expr = new $.binddata.Expression("not ! true");
	same(true, expr.evaluate({}), "'not not' works");
});

function testBinExpr(expr, data, result) {
	var xpr = new $.binddata.Expression(expr);
	data = $.observable(data);
	same(xpr.evaluate(data), result, expr);
}


test("binary expressions", function() {
	var data = {
		a: 5,
		b: 4
	};
	testBinExpr("a + b", data, 9);
	testBinExpr("a * b", data, 20);
	testBinExpr("2 + 2", data, 4);
	testBinExpr("a + 2 * b", data, 13);
	testBinExpr("b * (a + 2)", data, 28);
	testBinExpr("(a + 2) * b", data, 28);
	testBinExpr("'a' + 'b'", data, 'ab');
	testBinExpr("true and false", data, false);
	testBinExpr("1 + 2 + 3", data, 6);
	testBinExpr("a.aa * 2", {
		a: {aa: function() {return 2}}
	}, 4);
	testBinExpr("not false and not false", data, true);
});
