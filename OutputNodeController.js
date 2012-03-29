(function($) {
	
	var OutputNodeController = $.wiredui.OutputNodeController = function OutputNodeController(varCtx, parentController, token) {
		this.parentController = parentController;
		this.expr = new $.wiredui.Expression(token);
		this.initNode(varCtx);
	};
	
	OutputNodeController.prototype = new $.wiredui.NodeController();
	
	OutputNodeController.prototype.render = function(runID) {
		this.setupListeners(this.expr.dependencies, runID);
		this.saveLoopVariables(runID);
		var rval = this.expr.evaluate(this.varCtx.data);
		while ( $.isFunction(rval) ) {
			rval = rval();
		}
		return [document.createTextNode( rval ) ];
	}
	
	
	
})(jQuery);
