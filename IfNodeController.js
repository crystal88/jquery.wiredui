(function($) {

	var IfNodeController = $.wiredui.IfNodeController = function IfNodeController(varCtx, parentController, conditionStr) {
		this.initNode(varCtx);
		this.parentController = parentController;
		this.conditionStr = conditionStr;
		// log("IfNodeController created")
	}
	
	IfNodeController.prototype = new $.wiredui.NodeController();
	
	IfNodeController.prototype.createStatementController = function(str) {
		var stmtParts = $.wiredui.NodeController.stmtParts(str);
		if (stmtParts.stmtWord === "/if") {
			var unread = this.parser.getUnread();
			// console.log("pushing back unread text: '" + unread + "'");
			this.iterator.pushTextNode(unread);
			this.iterator.listener = this.parentController;
			return this.parentController;
		} else {
			return $.wiredui.NodeController.prototype.createStatementController.call(this, str);
		}
	};

})(jQuery);
