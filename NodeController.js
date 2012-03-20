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
		
		this.listeners = [];
		
		this.readDepth = 0;
		
		/** $.wiredui.DOMIterator */
		this.iterator = null;
		
		
		this.parentStack = [ this ];
		
		this.currentParent = this;
	}
	
	NodeController.prototype.setupListeners = function(deps, runID) {
		if (runID === undefined)
			throw "missing runID - failed to set up event listeners";
			
		var self = this;
		var reRender = function() {
			self.parentController.update(self, runID);
		}
		for (var i = 0; i < deps.length; ++i) {
			var depChain = deps[i];
			
			var prevFn = function(){};
			for (var j = depChain.length - 1; j >= 0; --j) {
				var fn = (function(j, prevFn) {
					
					return function(data) {
						if (this.ranAlready)
							return;
							
						this.ranAlready = true;
						
						if ( $.isFunction(data()[ depChain[j] ] ) ) {
							var listenerID = data()[ depChain[j] ].on("change", function(newVal){
								prevFn.ranAlready = false;
								prevFn.call(prevFn, newVal);
								reRender()							
							});
							if (self.listeners[runID] === undefined) {
								self.listeners[runID] = [];
							}
							self.listeners[runID].push({
								event: "change",
								id: listenerID,
								owner: data()[ depChain[j] ]
							});
							prevFn.call(prevFn, data()[ depChain[j] ] );
						}
					};
					
				})(j, prevFn);
				prevFn = fn;
			}
			prevFn.call(prevFn, this.varCtx.data);
		}
	}
	
	NodeController.prototype.removeListeners = function(runID, cascade) {
		if (undefined === runID)
			throw "missing runID - failed removeListeners()";
			
		for (var i = 0; i < this.listeners[runID].length; ++i) {
			var listener = this.listeners[runID][i];
			listener.owner.off(listener.event, listener.id);
		}
		
		if (undefined === cascade) {
			cascade = true;
		}
		
		if ( ! cascade)
			return;
			
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			this.childNodeControllers[i].nodeController.removeListeners(runID);
		}
	};
	
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
	
	NodeController.prototype.prepareRunID = function(runID) {
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			this.childNodeControllers[i].lastCreatedElems[runID] = {
				parentElem: null,
				elems: []
			};
		}
		
		var swallowCopyElem = function(elem) {
			if ( elem.tagName == "#text" )
				return document.createTextNode(elem.nodeValue);
			
			var rval = document.createElement(elem.tagName);
			
			for (var i = 0; i < elem.attributes.length; ++i) {
				var attr = elem.attributes[i];
				var newAttr = document.createAttribute(attr.name);
				newAttr.value = attr.value;
				rval.setAttribute(newAttr.name, newAttr);
			}
			return rval;
		};
		
		var traverse = function(childNodes) {
			var rval = [];
			for (var i = 0; i < childNodes.length; ++i) {
				var elem = childNodes[i];
				var newElem = swallowCopyElem( elem );
				var newChildNodes = traverse.call( this, elem.childNodes );
				for (var i = 0; i < newChildNodes.length; ++i) {
					newElem.appendChild(newChildNodes[i]);
				}
				for (var i = 0; i < this.childNodeControllers.length; ++i) {
					if (this.childNodeControllers[i].position.parentElem === elem) {
						this.childNodeControllers[i].lastCreatedElems[runID].parentElem = newElem;
						break;
					}
				}
				rval.push(newElem);
			}
			return rval;
		}
		return traverse.call( this, this.childNodes );
	}
	
	var appendAtPosition = function appendAtPosition(parentElem, childElems, idx) {
		var nodeStack = [];
		while (idx < parentElem.childNodes.length) {
			var remChild = parentElem.childNodes[idx];
			nodeStack.push(remChild);
			parentElem.removeChild( remChild );
		}
		
		for (j = 0; j < childElems.length; ++j) {
			parentElem.appendChild(childElems[j]);
		}
			
		for (j = 0; j < nodeStack.length; ++j) {
			parentElem.appendChild(nodeStack[j]);
		}
	}
	
	NodeController.prototype.renderBlock = function(runID) {
		if (runID === undefined)
			throw "missing runID - failed renderBlock()";
			
		var idxShift = 0;
		var prevParentElem = null;
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			var pos = this.childNodeControllers[i].position;
			var ctrl = this.childNodeControllers[i].nodeController;
			var ctrlDOM = this.childNodeControllers[i].lastCreatedElems[runID].elems = ctrl.render(runID);
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
		return this.renderBlock("");
	}
	
	NodeController.prototype.getChildNodeByCtrl = function(ctrl) {
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i].nodeController === ctrl) {
				return this.childNodeControllers[i];
			}
		}
		throw "childNodeController not found";
	}
	
	NodeController.prototype.update = function(childCtrl, runID) {
		if (undefined === runID)
			throw "missing runID - failed update()";
			
		var childNodeCtrl = this.getChildNodeByCtrl(childCtrl);
		var elemTrash = document.createElement("div");
		for (var i = 0; i < childNodeCtrl.lastCreatedElems[runID].elems.length; ++i) {
			elemTrash.appendChild( childNodeCtrl.lastCreatedElems[runID].elems[i] );
		}
		childCtrl.removeListeners(runID);
		var ctrlDOM = childNodeCtrl.lastCreatedElems[runID].elems = childCtrl.render(runID);
		
		var idxShift = 0;
		for (i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i] === childNodeCtrl) {
				break;
			}
			if (this.childNodeControllers[i].position.parentElem == childNodeCtrl.position.parentElem) {
				idxShift += childNodeCtrl.lastCreatedElems[runID].elems.length;
			}
		}
		appendAtPosition(childNodeCtrl.position.parentElem
			, ctrlDOM
			, childNodeCtrl.position.idx + idxShift);
	}

})(jQuery);
