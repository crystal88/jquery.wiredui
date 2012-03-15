(function($) {
	
	var OutputNodeController = $.wiredui.OutputNodeController = function(varCtx, parentController, token) {
		this.parentController = parentController;
		this.expr = new $.wiredui.Expression(token);
		this.initNode(varCtx);
	};
	
	OutputNodeController.prototype = new $.wiredui.NodeController();
	
	OutputNodeController.prototype.render = function(runID) {
		this.setupListeners(this.expr.dependencies, runID);
		return [document.createTextNode( this.expr.evaluate(this.varCtx.data)() ) ];
	}
	
	
	
})(jQuery);
