(function($) {

    var NodeController = $.binddata.NodeController = function NodeController(varCtx) {
		this.varCtx = varCtx;
		
		this.childNodes = [];
		
		this.childNodeControllers = [];
		
		this.readDepth = 0;
		
		/** $.binddata.NodeController */
		this.parentController = null;
		
		/** $.binddata.DOMIterator */
		this.iterator = null;
		
		
		this.parentStack = [ ];
		
		this.currentParent = this;
	};
	
	NodeController.prototype.startElem = function(elem) {
		++this.readDepth;
		if (elem.nodeType === "#text") {
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
	
	NodeController.prototype.readTextElem = function(str) {
		var parser = new $.binddata.TextElemParser(str);
		var token = null;
		while ( (token = parser.read()) !== null) {
			switch(token.type) {
				case "output":
				
					break;
				case "stmt":
					this.createChildNodeController(token.token);
					break;
				case "html":
					this.currentContainer.push(document.createTextNode(token.token));
					break;
			}
		}
	}
	
	NodeController.prototype.createChildNodeController = function(str) {
		var childNodeCtrl = new $.binddata.ChildNodeController();
		var pos = new $.binddata.ElemPosition();
		pos.idx = this.currentParent.childNodes.length;
		pos.parentElem = this.currentParent;
		childNodeCtrl.position = pos;
		var nodeController = childNodeCtrl.nodeController = this.createStatementController(str);
		this.childNodeControllers.push(childNodeCtrl);
		return nodeController;
	};
	
	NodeController.prototype.createStatementController = function(str) {
		var rval = null;
		
		var firstSpacePos = str.indexOf(" ");
		if (firstSpacePos == -1) {
			var stmtWord = str;
			var remaining = "";
		} else {
			var stmtWord = str.substr(0, firstSpacePos);
			var remaining = str.substr(firstSpacePos);
		}
		switch( stmtWord ) {
			case 'if':
				rval = new $.binddata.IfStatementNodeController(remaining);
			case 'elseif':
			case 'elif':
			case 'elsif':
				rval = new $.binddata.ElseIfStatementNodeController(remaining);
			case 'else':
				rval = new $.binddata.ElseStatementNodeController(remaining);
			case 'each':
				rval = new $.binddata.EachStatementNodeController(remaining);
			default:
				throw "invalid statement tag '" + str + "'";
		}
		rval.iterator = this.iterator;
		rval.parentController = this;
	};
	
	NodeController.prototype.finishElem = function(elem) {
		if (this.parentStack.length == 0)
			throw "failed finishElem: no opened elem";
		
		this.currentParent = this.parentStack.pop();
		
		if (this.parentStack.length == 0) {
			this.iterator.listener = this.parentController;
		}
	}

})(jQuery);
