(function($) {
	
	var DOMIterator = $.wiredui.DOMIterator = function DOMIterator(DOM) {
		var self = this;
		
		if (typeof(DOM) == "string") {
			this.DOM = $.parseXML(DOM);
		} else {
			this.DOM = DOM;
		}
		
		this.listener = null;
		
		this.pushedNode = null;
	};
	
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
			// console.log("start: " + nodeDbg);

			this.listener.startElem(childNode);
			
			if (this.pushedNode !== null) {
				this.listener.startElem(this.pushedNode);
				this.listener.finishElem(this.pushedNode);
				this.pushedNode = null;
			}
			
			this.read(childNode);
			
			this.listener.finishElem(childNode);
			// console.log("finish: " + nodeDbg);
		}
	}
	
	DOMIterator.prototype.pushTextNode = function(str) {
		// console.log("pushing " + str)
		if (typeof(str) == "string") {
			str = document.createTextNode(str);
		}
		this.pushedNode = str;
	}
	
})(jQuery);
