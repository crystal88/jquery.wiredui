(function($) {

	var ElseIfNodeController = $.wiredui.ElseIfNodeController = function ElseIfNodeController(varCtx, parentController, conditionStr) {
		this.initNode(varCtx);
		this.parentController = parentController;
		this.condExpr = new $.wiredui.Expression(conditionStr);
	}
	
	ElseIfNodeController.prototype = new $.wiredui.IfNodeController();
	
})(jQuery);
