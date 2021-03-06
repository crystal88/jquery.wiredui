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
		
		this.attributeControllers = [];
		
		this.listeners = [];
		
		this.readDepth = 0;
		
		/** $.wiredui.DOMIterator */
		this.iterator = null;
		
		
		this.parentStack = [ this ];
		
		this.currentParent = this;
		
		/**
		 * loop var name => {runID => $.observable}
		 */
		this.loopVariables = {};
		
		this.dependencies = [];
	}
	
	NodeController.prototype.setupListeners = function(deps, runID, reRender) {
		if (runID === undefined)
			throw "missing runID - failed to set up event listeners";
			
		this.dependencies = deps;
		var self = this;
        if (undefined === reRender) {
		    reRender = function() {
			    self.parentController.updateChild(self, runID);
		    };
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
						
						if ( $.isFunction(data()[ depChain[j] ] )
								&& data()[ depChain[j] ].__observable
								&& ! data()[ depChain[j] ].__observable.isIdxVar) {
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
		
		if ( this.listeners[runID] !== undefined ) {
			for (var i = 0; i < this.listeners[runID].length; ++i) {
				var listener = this.listeners[runID][i];
				listener.owner.off(listener.event, listener.id);
			}
		}
		
		if (undefined === cascade) {
			cascade = true;
		}
		
		if ( ! cascade)
			return;
			
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			this.childNodeControllers[i].nodeController.removeListeners(runID, true);
		}
	};
	
	NodeController.prototype.startElem = function(elem) {
		++this.readDepth;
		var x = this.parentStack.length;
		var debugStr = ""
		while (--x) debugStr += "  ";
		// console.log(debugStr + "readElem " + elem.nodeName)
		if (elem.nodeName === "#text") {
			this.readTextElem(elem.nodeValue);
		} else {
			var newElem = elem.cloneNode(false);

			this.createAttributeBindings(newElem);
			
			// console.log(debugStr + "  attaching to ", this.currentParent.nodeName || this.currentParent)
			this.currentParent.appendChild(newElem);
			
			this.parentStack.push(this.currentParent);
			this.currentParent = newElem;
		}
	};
	
	NodeController.prototype.createAttributeBindings = function(elem) {
		for (var i = 0; i < elem.attributes.length; ++i) {
			var attrName = elem.attributes[i].nodeName;
			var attrValue = elem.attributes[i].nodeValue;
			var parser = new $.wiredui.TextElemParser(attrValue);

			var token = null;
            var lastHtmlFragment = null;
            var controllerPassed = false;
			while( (token = parser.read()) !== null ) {
				switch(token.type) {
					case 'html':
						lastHtmlFragment = token.literal;
						break;
					case 'output':
                        var nodeController = new $.wiredui.OutputNodeController(
                            this.varCtx
                            , this
                            , token.literal
                        );
                        var attrPos = new $.wiredui.AttributePosition(elem, attrName);
                        if (lastHtmlFragment !== null) {
                            attrPos.htmlPrefix = lastHtmlFragment;
                            lastHtmlFragment = null;
                        }
                        var childAttrCtrl = {
                            position: attrPos,
                            nodeController: nodeController
                        };
                        this.attributeControllers.push(childAttrCtrl);
                        controllerPassed = true;
						break;
					case 'stmt':
                        console.log("itt: ", token);
                        var nodeController = this.createStatementController(token.literal);
                        var attrPos = new $.wiredui.AttributePosition(elem, attrName);
                        if (lastHtmlFragment !== null) {
                            attrPos.htmlPrefix = lastHtmlFragment;
                            lastHtmlFragment = null;
                        }
                        var childAttrCtrl = {
                            position: attrPos,
                            nodeController: nodeController
                        };
                        this.attributeControllers.push(childAttrCtrl);
                        this.iterator.listener = nodeController;
                        this.iterator.pushTextNode(parser.getUnread())
                        controllerPassed = true;
						break;
				}
			}
            if (lastHtmlFragment !== null && controllerPassed) {
                this.attributeControllers[this.attributeControllers.length - 1]
                    .position.htmlSuffix = lastHtmlFragment;
            }
		}
	}
	
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
						, token.literal);
					this.childNodeControllers.push(childNodeCtrl);
					break;
				case "stmt":
					var nodeController = this.createChildNodeController(token.literal);
					if (nodeController !== null) {
						this.iterator.listener = nodeController;
						this.iterator.pushTextNode(parser.getUnread());
					}
					break;
				case "html":
					this.currentParent.appendChild(document.createTextNode(token.literal));
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
	};

    NodeController.prototype.setAttributeParentForRunID = function (runID, origParentElem, actualParentElem) {
        for (var i in this.attributeControllers) {
            var childAttrCtrl = this.attributeControllers[i];
            if (childAttrCtrl.position.origParentElem == origParentElem) {
                childAttrCtrl.position.parentElems[runID] = actualParentElem;
            }
        }
    };
	
	NodeController.prototype.prepareRunID = function(runID) {
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			this.childNodeControllers[i].visibleElems[runID] = {
				parentElem: null,
				elems: []
			};
		}

        var self = this;
		
		var swallowCopyElem = function(elem) {
			if ( elem.nodeName == "#text" )
				return document.createTextNode(elem.nodeValue);
			
			var rval = document.createElement(elem.nodeName);

            self.setAttributeParentForRunID(runID, elem, rval);
			
			for (var i = 0; i < elem.attributes.length; ++i) {
				var attr = elem.attributes[i];
				var newAttr = document.createAttribute(attr.name);
				newAttr.value = attr.value;
				rval.setAttribute(newAttr.name, newAttr.value);
			}
			return rval;
		};
		var traverse = function(childNodes) {
			var rval = document.createElement("cnt");
			for (var i = 0; i < childNodes.length; ++i) {
				var elem = childNodes[i];
				var newElem = swallowCopyElem( elem );
				for (var j = 0; j < this.childNodeControllers.length; ++j) {
					if (this.childNodeControllers[j].position.parentElem === elem) {
						this.childNodeControllers[j].visibleElems[runID].parentElem = newElem;
					}
				}
				var newChildNodes = traverse.call( this, elem.childNodes ).childNodes;
				while (newChildNodes.length) {
					newElem.appendChild(newChildNodes[0]);
				}
				rval.appendChild(newElem);
			}
			return rval;
		}
		
		return traverse.call( this, this.childNodes );
	}
	
	var debugElems = function(elems) {
		var rval = [];
		for (var i = 0; i < elems.length; ++i) {
			if (elems[i].nodeName == "#text") {
				rval.push(elems[i].nodeValue);
			} else {
				rval.push(elems[i].nodeName);
			}
		}
		return rval;
	}
	
	/**
	 * @param DOMElem parentElem 
	 * @param NodeList childElems
	 * @param integer idx
	 */
	var appendAtPosition = function appendAtPosition(parentElem, childElems, idx) {
		//console.group("appendAtPosition()");
		//console.log("params: ", debugElems(parentElem.childNodes), debugElems(childElems), idx);
		var nodeStack = [];
		while (idx < parentElem.childNodes.length) {
			var remChild = parentElem.childNodes[idx];
			nodeStack.push(remChild);
			parentElem.removeChild( remChild );
		}

		var tmpArr = [];
		for (var i = 0; i < childElems.length; ++i) {
			tmpArr.push(childElems[i]);
		}
		for (var j = 0; j < tmpArr.length; j++) {
			parentElem.appendChild(tmpArr[j]);
		}
			
		for (j = 0; j < nodeStack.length; ++j) {
			parentElem.appendChild(nodeStack[j]);
		}
		//console.log("result: ", debugElems(parentElem.childNodes));
		//console.groupEnd();
	}
	
	NodeController.prototype.saveLoopVariables = function(runID) {
		for (var i = 0; i < this.dependencies.length; ++i) {
			var dep = this.dependencies[ i ];
			if (dep.length > 0) {
				var loopVarName = dep[ 0 ];
				if (this.varCtx.data()[ loopVarName ] !== undefined) {
					var wrappedLoopVar = this.varCtx.data()[ loopVarName ];
					if (wrappedLoopVar.__observable.isValVar) {
						if (this.loopVariables[ loopVarName ] === undefined) {
							this.loopVariables[ loopVarName ] = {};
						}
						this.loopVariables[ loopVarName][ runID] = wrappedLoopVar;
					}
				}
			}
		}
	}
	
	NodeController.prototype.loadLoopVariables = function(runID) {
		for (var loopVarName in this.loopVariables) {
			if (this.loopVariables[ loopVarName ][ runID ] !== undefined) {
				this.varCtx.data()[ loopVarName ] = this.loopVariables[ loopVarName ][ runID ];
			}
		}
	}
	
	NodeController.prototype.renderBlock = function(runID) {
		if (runID === undefined)
			throw "missing runID - failed renderBlock()";

		var rval = this.prepareRunID(runID);
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			var parentElem = this.childNodeControllers[i].visibleElems[runID].parentElem;
			if (null == parentElem) {
				parentElem = rval;
			}
				
			var posIdx = this.childNodeControllers[i].position.idx;
			var ctrl = this.childNodeControllers[i].nodeController;
			var ctrlDOM =  ctrl.render(runID);
			var newElems = [];
			for (var j = 0; j < ctrlDOM.length; ++j) {
				newElems.push(ctrlDOM[j]);
			}
			this.childNodeControllers[i].visibleElems[runID].elems = newElems;
			this.childNodeControllers[i].visibleElems[runID].parentElem = parentElem;
			appendAtPosition(parentElem, ctrlDOM, NodeController.prototype.getIdxShiftFor.call(this, runID
				, parentElem
				, this.childNodeControllers[i]));
		}
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i].visibleElems[runID].parentElem === rval) {
				this.childNodeControllers[i].visibleElems[runID].parentElem = null;
			}
		}

        this.updateAttributes(runID);

		return rval.childNodes;
	}

    /**
     * Updates the attribute values which contain node controllers.
     *
     * If childCtrl is undefined then it updates all attribute values
     * containing node controllers, otherwise it only updates the
     * attribute value which contains childCtrl. In the latter case
     * every other node controller's value in the given attribute value
     * is also re-evaluated.
     *
     * childCtrl is undefined when a given DOM subtree is rendered first time,
     * and a NodeController instance when a node controller's dependent data
     * changes therefore the node controller's value should be re-evaluated.
     *
     * In the first case updateAttributes() is called by NodeController.renderBlock()
     *
     * In the latter case updateAttributes() is called by NodeController.updateAttribute()
     *
     * @param runID
     * @param childCtrl
     */
    NodeController.prototype.updateAttributes = function(runID, childCtrl) {
        var processedAttrCtrlIndices = [];

        for (var i = 0; i < this.attributeControllers.length; ++i) {
            if (processedAttrCtrlIndices[i] === true)
                continue;

            var attrControllers = this.getAttributeControllersByPosition(
                this.attributeControllers[i].position
            );

            if (childCtrl !== undefined) {
                var found = false;
                for (var j = 0; j < attrControllers.length; ++j) {
                    if (attrControllers[j] === childCtrl) {
                        found = true;
                        break;
                    }
                }
                if ( ! found)
                    break;
            }

            var newAttrValue = '';

            for (var origIdx in attrControllers) {
                if (processedAttrCtrlIndices[origIdx] === true)
                    throw "cannot re-render the same attribute controller twice (idx: " + origIdx + ")";

                var attrCtrl = attrControllers[origIdx];
                var attrPos = this.attributeControllers[origIdx].position;

                var subList = attrCtrl.render(runID);
                for (var j in subList) {
                    if (attrPos.htmlPrefix !== null) {
                        newAttrValue += attrPos.htmlPrefix;
                    }

                    newAttrValue += subList[j].nodeValue;

                    if (attrPos.htmlSuffix) {
                        newAttrValue += attrPos.htmlSuffix;
                    }
                }

                processedAttrCtrlIndices[origIdx] = true;
            }
            var attrs = this.attributeControllers[i].position.parentElems[runID].attributes;
            for (var attrIdx = 0; attrIdx < attrs.length; ++attrIdx) {
                if (attrs[attrIdx].name == this.attributeControllers[i].position.attrName) {
                    attrs[attrIdx].value = newAttrValue;
                    break;
                }
            }

        }
    };

    /**
     * Queries the attribute controllers which belong to the DOM elem
     * and its attribute marked by the position.
     *
     * In the return value the indices won't be sequential, instead they will
     * be the index of the node controller in the this.attributeControllers array.
     *
     * @param position
     * @return Array<$.wiredui.NodeController>
     */
    NodeController.prototype.getAttributeControllersByPosition = function(position) {
        var rval = [];
        for (var i = 0; i < this.attributeControllers.length; ++i) {
            var attrCtrl = this.attributeControllers[i];
            if (attrCtrl.position.attrName == position.attrName
                && attrCtrl.position.origParentElem == position.origParentElem) {
                rval[i] = attrCtrl.nodeController;
            }
        }
        return rval;
    };

	NodeController.prototype.getIdxShiftFor = function(runID, parentElem, targetController) {
		var rval = targetController && targetController.position.idx || (undefined === targetController ? this.childNodes.length : 0);
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			var childCtrl = this.childNodeControllers[i];
			//console.log("this.childNodeControllers[ " + i + " ] = ", childCtrl);
			if (childCtrl === targetController) {
				break;
			}
			if (childCtrl.visibleElems[runID].parentElem === parentElem) {
				rval += childCtrl.visibleElems[runID].elems.length;
			}
		}
		return rval;
	};
	
	NodeController.prototype.render = function() {
		return this.renderBlock("0");
	}
	
	NodeController.prototype.getChildNodeByCtrl = function(ctrl) {
		for (var i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i].nodeController === ctrl) {
				return this.childNodeControllers[i];
			}
		}
		throw "childNodeController not found";
	}
	
	NodeController.prototype.updateChild = function(childCtrl, runID) {
		if (undefined === runID)
			throw "missing runID - failed updateChild()";

		var childNodeCtrl = null;
        try {
            childNodeCtrl = this.getChildNodeByCtrl(childCtrl);
        } catch (e) {
            if (e === "childNodeController not found") {
                this.updateAttributes(runID, childCtrl);
                return;
            }
            throw e;
        }

		var elemTrash = document.createElement("div");
		for (var i = 0; i < childNodeCtrl.visibleElems[runID].elems.length; ++i) {
			elemTrash.appendChild( childNodeCtrl.visibleElems[runID].elems[i] );
		}
		childCtrl.removeListeners(runID);
		
		childCtrl.loadLoopVariables(runID);
		
		var ctrlDOM = childCtrl.render(runID);
		var newElems = [];
		for (var j = 0; j < ctrlDOM.length; ++j) {
			newElems.push(ctrlDOM[j]);
		}
		
		childNodeCtrl.visibleElems[runID].elems = newElems;
		
		var idxShift = 0;
		for (i = 0; i < this.childNodeControllers.length; ++i) {
			if (this.childNodeControllers[i] === childNodeCtrl) {
				break;
			}
			if (this.childNodeControllers[i].position.parentElem == childNodeCtrl.position.parentElem) {
				idxShift += childNodeCtrl.visibleElems[runID].elems.length;
				idxShift += this.childNodeControllers[i].visibleElems[runID].elems.length;
				//console.log("idxShift += " + this.childNodeControllers[i].visibleElems[runID].elems.length, this.childNodeControllers[i].nodeController, runID)
			}
		}
		var parentElem = childNodeCtrl.visibleElems[runID].parentElem;
		if (null === parentElem) {
			this.parentController.partialUpdateChild(this
				, this.runIDForParent(runID)
				, this.getIdxShiftFor(runID, parentElem, childNodeCtrl)
				, ctrlDOM);
		} else {
			appendAtPosition(parentElem
				, ctrlDOM
				, this.getIdxShiftFor(runID, parentElem, childNodeCtrl));
		}
	}
	
	NodeController.prototype.runIDForParent = function(runID) {
		return runID;
	}
	
	/**
	 * @param NodeController childCtrl
	 * @param String runID
	 * @param Integer insertIdx
	 * @param NodeList newElems 
	 */
	NodeController.prototype.partialUpdateChild = function(childCtrl, runID, insertIdx, newElems) {
		var childNodeCtrl = this.getChildNodeByCtrl(childCtrl);
		var parentElem = childNodeCtrl.visibleElems[runID].parentElem;
		var idxShift = this.getIdxShiftFor(runID, parentElem, childNodeCtrl);
		if (null === parentElem) {
			/*console.log("parentController.partialUpdateChild(", this
				, this.runIDForParent(runID)
				, insertIdx + idxShift, newElems);*/
			this.parentController.partialUpdateChild(this
				, this.runIDForParent(runID)
				, insertIdx + idxShift
				, newElems);
		} else {
			appendAtPosition(parentElem
				, newElems
				, insertIdx + idxShift);
		}
	}
	
	NodeController.prototype.getParentElemForChild = function(childCtrl, runID) {
		return this.getChildNodeByCtrl(childCtrl).visibleElems[runID].parentElem;
	}

})(jQuery);
