(function($) {
	
	var DOMIterator = $.wiredui.DOMIterator = function DOMIterator(DOM) {
		var self = this;
		
		if (typeof(DOM) == "string") {
			this.DOM = $.parseXML(DOM);
		} else {
			this.DOM = DOM;
		}
		
		this.listener = null;
		
		this.pushedNodes = [];
	};
	
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
	
	DOMIterator.prototype.read = function(parentNode) {
		if (null === this.listener)
			throw "cannot read if no listener is given";
			
		if ( ! parentNode) {
			parentNode = this.DOM;
		}
			
		var childNodes = parentNode.childNodes;
		for (var i = 0; i < childNodes.length; ++i) {
			var childNode = childNodes[i];
			var nodeDbg = childNode.nodeName;
			if (nodeDbg == "#text") {
				nodeDbg += " (" + childNode.nodeValue + ")";
			}

			this.listener.startElem(childNode);
			
			while (this.pushedNodes.length > 0) {
				var tmp = this.pushedNodes.pop();
				this.pushedNode = null;
				this.listener.startElem(tmp);
				this.listener.finishElem(tmp);
			}
			
			this.read(childNode);
			
			this.listener.finishElem(childNode);
		}
	}
	
	DOMIterator.prototype.pushTextNode = function(str) {
		if (typeof(str) == "string") {
			str = document.createTextNode(str);
		}
		this.pushedNodes.push(str);
	}
	
})(jQuery);
