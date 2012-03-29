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
			console.log("start: " + nodeDbg);

			this.listener.startElem(childNode);
			
			while (this.pushedNodes.length > 0) {
				var tmp = this.pushedNodes.pop();
				console.log("re-start ", debugElems( [tmp] )[0])
				this.pushedNode = null;
				this.listener.startElem(tmp);
				this.listener.finishElem(tmp);
				console.log("re-finish ", debugElems( [tmp] )[0])
			}
			
			this.read(childNode);
			
			this.listener.finishElem(childNode);
			console.log("finish: " + nodeDbg);
		}
	}
	
	DOMIterator.prototype.pushTextNode = function(str) {
		console.warn("pushed back '" + str + "'", typeof str, str.length, this.listener);
		if (typeof(str) == "string") {
			str = document.createTextNode(str);
		}
		this.pushedNodes.push(str);
	}
	
})(jQuery);
