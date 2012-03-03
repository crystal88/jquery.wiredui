(function($) {
	
	$.binddata = function(tpl, data) {
		$.binddata.buildController(tpl, data);
		return this;
	}
	
	$.binddata.buildController = function(tpl, data) {
		var iterator = new $.binddata.DOMIterator(tpl);
		var ctrl = new $.binddata.NodeController(data);
		iterator.listener = ctrl;
		ctrl.iterator = iterator;
		iterator.read();
		return ctrl;
	};
	
})(jQuery);
