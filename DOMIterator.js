(function($) {
	
	$.binddata.DOMIterator = function DOMIterator(DOM) {
		var self = this;
		
		if (typeof(DOM) == "string") {
			this.DOM = $.parseXML(DOM);
		} else {
			this.DOM = DOM;
		}
		
		this.listener = null;
	
		this.read = function(parentNode) {
			if (null === this.listener)
				throw "cannot read if no listener is given";
			
			if ( ! parentNode) {
				parentNode = self.DOM;
			}
		
			var childNodes = parentNode.childNodes;
			for (var i = 0; i < childNodes.length; ++i) {
				var childNode = childNodes[i];
				self.listener.startElem(childNode);
				self.read(childNode);
				self.listener.finishElem(childNode);
			}
			
			
		}
	};
	
})(jQuery);
