(function($) {
	
	var trim = function(token) {
		return token.replace(/\s+$/, '').replace(/^\s+/, '');
	}
	
	var EachNodeController = $.wiredui.EachNodeController = function EachNodeController(varCtx, parentController, remaining) {
		this.initNode(varCtx);
		this.parentController = parentController;
		
		var asPos = remaining.lastIndexOf(' as ');
		this.collVarName = trim(remaining.substr(0, asPos));
		var varStr = trim(remaining.substr(asPos + 4));
		var arrowPos = varStr.indexOf('=>');
		if (-1 == arrowPos) {
			this.valVarName = varStr;
		} else {
			this.idxVarName = trim(varStr.substr(0, arrowPos));
			this.valVarName = trim(varStr.substr(arrowPos + 2));
		}
	};
	
	EachNodeController.prototype = new $.wiredui.NodeController();
	
	/**
	 * If encounters a /each node then assigns the parent controller to the
	 * iterator listener and returns the parent controller.
	 * 
	 * Otherwise calls NodeController.createStatementController()
	 */
	EachNodeController.prototype.createStatementController = function(str) {
		var stmtParts = $.wiredui.NodeController.stmtParts(str);
		if (stmtParts.stmtWord === "/each") {
			var unread = this.parser.getUnread();
			this.iterator.pushTextNode(unread);
			this.iterator.listener = this.parentController;
			return this.parentController;
		} else {
			return $.wiredui.NodeController.prototype.createStatementController.call(this, str);
		}
	};
	
	EachNodeController.prototype.render = function(runID) {
		var rval = [];
		var coll = this.varCtx.getValue(this.collVarName)
		while ( $.isFunction(coll) ) {
			coll = coll();
		}
		if (this.idxVarName !== undefined) {
			var ctxHasIdxVar = $.isFunction(this.varCtx.data()[this.idxVarName])
			var ctxIdxVar = this.varCtx.data()[this.idxVarName];
			this.varCtx.data()[this.idxVarName] = $.observable(null);
		}
		
		var self = this;
		var childRunCtr = 0;
		
		var loopBody = function(idx, val) {
			if (self.idxVarName !== undefined) {
				self.varCtx.data()[self.idxVarName](i);
				self.varCtx.data()[self.idxVarName].__observable.isIdxVar = true;
			}
			var childRunID = ( (tmpArr = runID.split(";")).push(childRunCtr), tmpArr ).join(";");
			var loopResult = self.renderBlock(runID);
			for (var j = 0; j < loopResult.length; ++j) {
				rval.push(loopResult[j]);
			}
			++childRunCtr;
		}
		if ( $.isArray(coll) ) {
			for (var i = 0; i < coll.length; ++i) {
				loopBody(i, coll[i]);
			}
		} else {
			for (var i in coll) {
				loopBody(i, coll[i]);
			}
		}
		return rval;
	}
	
})(jQuery);
