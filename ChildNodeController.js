(function($) {

	$.binddata.ChildNodeController = function() {
		
		/* Array<DOMElem */
		this.lastCreatedElems = [];
		
		/* $.binddata.NodeController */
		this.nodeController = null;
		
		/* $.binddata.ElemPosition */
		this.position = null;
	};

})(jQuery);
