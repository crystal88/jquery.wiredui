(function($) {
	
	$.wiredui.OutputNodeController = function(varCtx, parentController, token) {
		this.parentController = parentController;
		this.outputVarName = token;
		this.initNode(varCtx);
	};
	
	$.wiredui.OutputNodeController.prototype = new $.wiredui.NodeController();
	
	
	
})(jQuery);
