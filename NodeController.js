(function($) {

    var NodeController = $.wiredui.NodeController = function NodeController(varCtx) {
		this.initNode(varCtx);
		
		/** $.wiredui.NodeController */
		this.parentController = null;
	};
	
	NodeController.prototype.initNode = function(varCtx) {
		this.varCtx = varCtx;
		
		this.childNodes = [];
		
		this.childNodeControllers = [];
		
		this.readDepth = 0;
		
		/** $.wiredui.DOMIterator */
		this.iterator = null;
		
		
		this.parentStack = [ this ];
		
		this.currentParent = this;
	}
	
	NodeController.prototype.setupListeners = function(deps) {
		var self = this;
		var reRender = function() {
			self.parentController.update(self);
		}
		for (var i = 0; i < deps.length; ++i) {
			var depChain = deps[i];
			
			var prevFn = function(){};
			for (var j = depChain.length - 1; j >= 0; --j) {
				var prevFnFn = prevFn;
				var fn = (function(jj) {
					
					return function(data) {
						if ( $.isFunction(data()[ depChain[jj] ] ) ) {
							var subFn = function(newVal){
								prevFnFn(newVal);
								reRender()							
							};
							data()[ depChain[jj] ].on("change", subFn );
							prevFnFn(data()[ depChain[jj] ] );
						}
					};
					
				})(j);
				prevFn = fn;
			}
			prevFn(this.varCtx.data);
		}
	}
	
	NodeController.prototype.startElem = function(elem) {
		++this.readDepth;
		if (elem.nodeName === "#text") {
			this.readTextElem(elem.nodeValue);
		} else {
			var newElem = elem.cloneNode();
			
			// cleaning the child nodes - it will be re-populated by subsequent startElem() calls
			while (newElem.childNodes.length > 0) {
				newElem.removeChild(newElem.childNodes[0]);
			}
			
			this.currentParent.appendChild(newElem);
			
			this.parentStack.push(this.currentParent);
			this.currentParent = newElem;
		}
	};
	
	NodeController.prototype.appendChild = function(child) {
		this.childNodes.push(child);
	};
	
	NodeController.prototype.removeChild = function(child) {
		var idx = null;
		for (var i = 0; i < this.childNodes.length; ++i) {
			if (this.childNodes[i] == child) {
				idx = i;
				break;
			}
		}
		if (null === idx)
			throw "failed to remove childNode";
			
		this.childNodes.splice(idx, 1);
	}
	
	NodeController.prototype.readTextElem = function(str) {
		var parser = this.parser = new $.wiredui.TextElemParser(str);
		var token = null;
		while ( (token = parser.read()) !== null) {
			switch(token.type) {
				case "output":
					var childNodeCtrl = new $.wiredui.ChildNodeController();
					var pos = new $.wiredui.ElemPosition();
					pos.idx = this.currentParent.childNodes.length;
					pos.parentElem = this.currentParent;
					childNodeCtrl.position = pos;
					childNodeCtrl.nodeController = new $.wiredui.OutputNodeController(this.varCtx
						, this
						, token.token);
					this.childNodeControllers.push(childNodeCtrl);
					break;
				case "stmt":
					var nodeController = this.createChildNodeController(token.token);
					if (nodeController !== null) {
						// console.log("switching listener at "+token.token);
						// console.log(nodeController);
						this.iterator.listener = nodeController;
						this.iterator.pushTextNode(parser.getUnread());
					}
					break;
				case "html":
					this.currentParent.appendChild(document.createTextNode(token.token));
					break;
			}
		}
		this.parser = null;
	}
	
	NodeController.prototype.createChildNodeController = function(str) {
		var childNodeCtrl = new $.wiredui.ChildNodeController();
		var pos = new $.wiredui.ElemPosition();
		pos.idx = this.currentParent.childNodes.length;
		pos.parentElem = this.currentParent;
		childNodeCtrl.position = pos;
		var nodeController = childNodeCtrl.nodeController = this.createStatementController(str);
		if (nodeController !== null) {
			if (nodeController !== this.parentController) {
				if (nodeController instanceof $.wiredui.ElseIfNodeController) {
					$.wiredui.IfNodeController.appendElseIf(nodeController);
				} else if (nodeController instanceof $.wiredui.ElseNodeController) {
					$.wiredui.IfNodeController.appendElse(nodeController);
				} else {
					this.childNodeControllers.push(childNodeCtrl);
				}
			}
			return nodeController;
		}
		return null;
	};
	
	/**
	 * Helper function to explode the command name (string part before the first space)
	 * and the command-specific parts.
	 * 
	 * @usedby NodeController.prototype.createStatementController()
	 * @usedby IfNodeController.prototype.createStatementController()
	 * 
	 */
	NodeController.stmtParts = function(str) {
		var firstSpacePos = str.indexOf(" ");
		if (firstSpacePos == -1) {
			var stmtWord = str;
			var remaining = "";
		} else {
			var stmtWord = str.substr(0, firstSpacePos);
			var remaining = str.substr(firstSpacePos);
		}
		return {
			"stmtWord" : stmtWord,
			"remaining": remaining
		};
	}
	
	NodeController.prototype.createStatementController = function(str) {
		var rval = null;
		var stmtParts = NodeController.stmtParts(str);
		var stmtWord = stmtParts.stmtWord;
		var remaining = stmtParts.remaining;
		var varCtx = this.varCtx;
		switch( stmtWord ) {
			case 'if':
				rval = new $.wiredui.IfNodeController(this.varCtx, this, remaining);
				break;
			case 'elseif':
			case 'elif':
			case 'elsif':
				rval = new $.wiredui.ElseIfNodeController(this.varCtx, this, remaining);
				break;
			case 'else':
				rval = new $.wiredui.ElseNodeController(this.varCtx, this, remaining);
				break;
			case 'each':
				rval = new $.wiredui.EachNodeController(this.varCtx, this, remaining);
				break;
			default:
				throw "invalid statement tag '" + str + "'";
		}
		rval.iterator = this.iterator;
		rval.parentController = this;
		return rval;
	};
	
	NodeController.prototype.finishElem = function(elem) {
		if (elem.nodeName == "#text")
			// not much to do here
			return;
			
		if (this.parentStack.length == 0)
			throw "failed finishElem " + elem.nodeName + ": no opened elem";
		
		this.currentParent = this.parentStack.pop();
		/*if (this.parentStack.length == 0) {
			this.iterator.listener = this.parentController;
			console.log("setting listener to parentController:")
			console.log(this.parentController)
		}*/
	}
	
	var appendAtPosition = function appendAtPosition(parentElem, childElems, idx) {
		var nodeStack = [];
		while (idx < parentElem.childNodes.length) {
			var remChild = parentElem.childNodes[idx];
			nodeStack.push(remChild);
			console.log("removeChild() comes");
			parentElem.removeChild( remChild );
			console.log("removeChild() goes");
		}
		
		for (j = 0; j < childElems.length; ++j) {
			parentElem.appendChild(childElems[j]);
		}
			
		for (j = 0; j < nodeStack.length; ++j) {
			parentElem.appendChild(nodeStack[j]);
		}
	}
	
	NodeController.prototype.renderBlock = function() {
		var idxShift = 0;
		var prevParentElem = null;
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			var pos = this.childNodeControllers[i].position;
			var ctrl = this.childNodeControllers[i].nodeController;
			var ctrlDOM = this.childNodeControllers[i].lastCreatedElems = ctrl.render();
			if (prevParentElem !== pos.parentElem) {
				idxShift = 0;
			}
			appendAtPosition(pos.parentElem, ctrlDOM, pos.idx + idxShift);
			
			if (prevParentElem === pos.parentElem || prevParentElem === null) {
				idxShift += ctrlDOM.length;
			}
			prevParentElem = pos.parentElem;
		}
		return this.childNodes;
	}
	
	NodeController.prototype.render = function() {
		return this.renderBlock();
	}
	
	NodeController.prototype.getChildNodeByCtrl = function(ctrl) {
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i].nodeController === ctrl) {
				return this.childNodeControllers[i];
			}
		}
		throw "childNodeController not found";
	}
	
	NodeController.prototype.update = function(childCtrl) {
		var childNodeCtrl = this.getChildNodeByCtrl(childCtrl);
		var elemTrash = document.createElement("div");
		for (var i = 0; i < childNodeCtrl.lastCreatedElems.length; ++i) {
			elemTrash.appendChild( childNodeCtrl.lastCreatedElems[i] );
		}
		var ctrlDOM = childNodeCtrl.lastCreatedElems = childCtrl.render();
		
		var idxShift = 0;
		for (i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i] === childNodeCtrl) {
				break;
			}
			if (this.childNodeControllers[i].position.parentElem == childNodeCtrl.position.parentElem) {
				idxShift += childNodeCtrl.lastCreatedElems.length;
			}
		}
		appendAtPosition(childNodeCtrl.position.parentElem
			, ctrlDOM
			, childNodeCtrl.position.idx + idxShift);
	}

})(jQuery);
