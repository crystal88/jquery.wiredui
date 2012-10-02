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
		this.valValues = [];
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
	
	EachNodeController.prototype.getIdxShiftFor = function(runID, parentElem, targetController) {
		var rval = targetController.position.idx;
		var tmp, lastSegment;
		var parentRunID = ( (tmp = runID.split(";")), lastSegment = tmp.pop(), tmp).join(";");
		for (var i = 0; i < lastSegment; ++i) {
			var parentRval = $.wiredui.NodeController.prototype.getIdxShiftFor.call(this, parentRunID + ";" + i, null, undefined);
			rval += targetController.position.idx + parentRval;
		}
		/**console.groupEnd();
		console.group("current run counting");/**/
		for (i = 0; i < this.childNodeControllers.length; ++i) {
			var childCtrl = this.childNodeControllers[i];
			//console.log("testing childNodeControllers[ " + i + " ]", this.childNodeControllers[i].nodeController);
			if (childCtrl === targetController) {
				break;
			}
			//console.log(childCtrl.visibleElems[runID].parentElem, " =?= ", parentElem);
			if (childCtrl.visibleElems[runID].parentElem === parentElem) {
				rval += childCtrl.visibleElems[runID].elems.length;
			}
		}
		/**console.groupEnd();
		console.log("rval = ", rval);
		console.groupEnd();/**/
		return rval;
	}
	
	EachNodeController.prototype.runIDForParent = function(runID) {
		var tmpArr;
		return ((tmpArr = runID.split(";")).pop(), tmpArr).join(";");
	}
	
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
		if ( ! this.valVarName)
			throw "syntax error: {{each " + this.collVarName + " as "
				+ (this.idxVarName ? this.idxVarName + " => " : "") + "}}";
		
		var ctxHasValVar = $.isFunction(this.varCtx.data()[ this.valVarName ]);
		if ( ctxHasValVar ) {
			var ctxValVar = this.varCtx.data()[ this.valVarName ];
		}
		
		
		var self = this;
		var childRunCtr = 0;
		this.valValues[runID] = [];
		var loopBody = function(idx, val) {
			self.valValues[runID][idx] = val;
			if (self.idxVarName !== undefined) {
				self.varCtx.data()[self.idxVarName](i);
				self.varCtx.data()[self.idxVarName].__observable.isIdxVar = true;
			}
			(self.varCtx.data()[self.valVarName] = val).__observable.isValVar = true;
			var childRunID = ( (tmpArr = runID.split(";")).push(childRunCtr), tmpArr ).join(";");
			var loopResult = self.renderBlock(childRunID);
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
		
		if (ctxHasIdxVar) {
			this.varCtx.data()[ this.idxVarName ] = ctxIdxVar;
		}
		if (ctxHasValVar) {
			this.varCtx.data()[ this.valVarName ] = ctxValVar;
		}
		return rval;
	}
	
})(jQuery);
