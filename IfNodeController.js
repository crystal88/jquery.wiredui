(function($) {

	var IfNodeController = $.wiredui.IfNodeController = function IfNodeController(varCtx, parentController, conditionStr) {
		this.initNode(varCtx);
		this.parentController = parentController;
		this.condExpr = new $.wiredui.Expression(conditionStr);
		IfNodeController.lastCreatedIf = this;
		
		/** Array<$.wiredui.ElseIfController> */
		this.elseIfNodes = [];
		
		/** Array<$.wiredui.ElseController> */
		this.elseNode = null;
		
		if (varCtx !== undefined) {
			this.setupListeners(this.condExpr.dependencies);
		}
	}
	
	IfNodeController.lastCreatedIf = null;
	
	IfNodeController.appendElseIf = function(elseIfController) {
		if (this.lastCreatedIf === null)
			throw "syntax error: unexpected 'else'";
			
		if (this.lastCreatedIf.elseNode !== null)
			throw "syntax error: unexpected 'elseif' after 'else'";
			
		this.lastCreatedIf.elseIfNodes.push(elseIfController);
	};
	
	IfNodeController.appendElse = function(elseController) {
		if (this.lastCreatedIf === null)
			throw "syntax error: unexpected 'else'";
			
		if (this.lastCreatedIf.elseNode !== null)
			throw "syntax error: unexpected 'else'";
			
		if ( ! (elseController instanceof $.wiredui.ElseNodeController))
			throw "IfNodeController.elseNode must be an ElseNodeController instance";

		this.lastCreatedIf.elseNode = elseController;
	}
	
	IfNodeController.prototype = new $.wiredui.NodeController();
	
	/**
	 * If encounters a /if node then assigns the parent controller to the
	 * iterator listener and returns the parent controller.
	 * 
	 * Otherwise calls NodeController.createStatementController()
	 */
	IfNodeController.prototype.createStatementController = function(str) {
		var stmtParts = $.wiredui.NodeController.stmtParts(str);
		if (stmtParts.stmtWord === "/if") {
			IfNodeController.lastCreatedIf = null;
			
			var unread = this.parser.getUnread();
			// console.log("pushing back unread text: '" + unread + "'");
			this.iterator.pushTextNode(unread);
			this.iterator.listener = this.parentController;
			return this.parentController;
		} else {
			return $.wiredui.NodeController.prototype.createStatementController.call(this, str);
		}
	};
	
	IfNodeController.prototype.render = function() {
		if ( this.condExpr.evaluate(this.varCtx.data)() ) {
			return this.renderBlock();
		}
		return this.elseNode.renderBlock();
	}

})(jQuery);
