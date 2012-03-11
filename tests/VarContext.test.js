module("Variable Context");
/**/
test("VarContext.getValue()", function() {
	var ctx = new $.wiredui.VarContext($.observable({
		xx: "xx",
		yy: {
			aa: "aa"
		}
	}));
	
	same(ctx.getValue("xx")(), "xx");
	same(ctx.getValue("yy.aa")(), "aa");
});
/**/
