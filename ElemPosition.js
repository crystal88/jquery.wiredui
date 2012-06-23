(function($) {
	
	var ElemPosition = $.wiredui.ElemPosition = function(parentElem, idx) {
		this.init(parentElem, idx);
	};
	
	ElemPosition.prototype.init = function(parentElem, idx) {
		this.parentElem = parentElem;
		this.idx = idx;
	}
	
	
	
})(jQuery);
