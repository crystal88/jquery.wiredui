(function($) {
	
	$.wiredui = function(tpl, data) {
		var ctrl = $.wiredui.buildController(tpl, data);
		var DOM = ctrl.render();
		for(var i = 0; i < DOM.childNodes.length; ++i) {
			this.appendChild(DOM.childNodes[i]);
		}
		return this;
	}
	
	$.wiredui.buildController = function(tpl, data) {
		var iterator = new $.wiredui.DOMIterator(tpl);
		var ctrl = new $.wiredui.NodeController(new $.wiredui.VarContext($.observable(data)));
		iterator.listener = ctrl;
		ctrl.iterator = iterator;
		iterator.read();
		return ctrl;
	};
	
})(jQuery);
