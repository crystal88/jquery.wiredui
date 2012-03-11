module("DOMIterator")
/**/
test("Iteration failing without listener", function() {
	
	var iterator = new $.wiredui.DOMIterator("<html></html>");
	
	var failed = false;
	try {
		iterator.read();
	} catch (e) {
		failed = true;
	}
	ok(failed, "exception thrown if no listener is set up")
	
});

test("Iteration test", function() {
	
	var iterator = new $.wiredui.DOMIterator("<html><div>x</div><div/></html>");
	
	var openCount = 0;
	var maxDepth = 0;
	
	iterator.listener = {
        startElem: function(elem) {
            ++openCount;
            if (openCount > maxDepth) {
                maxDepth = openCount;
            }
        },
        finishElem: function(elem) {
            --openCount;
        }
    };
	iterator.read();
	same(openCount, 0, "all elems opened-closed");
	same(maxDepth, 3, "max depth is 3");	
});


/**/
