(function($) {

	$.wiredui.ChildNodeController = function() {
		
		/* Array<DOMElem */
		this.lastCreatedElems = [];
		
		/* $.wiredui.NodeController */
		this.nodeController = null;
		
		/* $.wiredui.ElemPosition */
		this.position = null;
	};

})(jQuery);
