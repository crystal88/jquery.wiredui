(function($) {

	$.wiredui.IfNodeController = function IfNodeController(varCtx, parentController, conditionStr) {
		this.initNode(varCtx);
		this.parentController = parentController;
		this.conditionStr = conditionStr;
	}
	
	$.wiredui.IfNodeController.prototype = new $.wiredui.NodeController();

})(jQuery);
