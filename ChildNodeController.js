(function($) {

	$.wiredui.ChildNodeController = function() {
		
		/* Array<DOMElem> */
		this.visibleElems = [];
		
		/* $.wiredui.NodeController */
		this.nodeController = null;
		
		/* $.wiredui.ElemPosition */
		this.position = null;
	};

})(jQuery);
