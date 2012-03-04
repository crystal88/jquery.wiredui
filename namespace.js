(function($) {
	
	$.wiredui = function(tpl, data) {
		$.wiredui.buildController(tpl, data);
		return this;
	}
	
	$.wiredui.buildController = function(tpl, data) {
		var iterator = new $.wiredui.DOMIterator(tpl);
		var ctrl = new $.wiredui.NodeController($.observable(data));
		iterator.listener = ctrl;
		ctrl.iterator = iterator;
		iterator.read();
		return ctrl;
	};
	
})(jQuery);
