(function($) {
	
	var ElseNodeController = $.wiredui.ElseNodeController = function ElseNodeController(varCtx, parentController, conditionStr) {
		this.initNode(varCtx);
		this.parentController = parentController;
		if (conditionStr)
			throw "syntax error: unexpected '" + conditionStr + "' after else'";
	}
	
	ElseNodeController.prototype = new $.wiredui.IfNodeController();
	
})(jQuery);
