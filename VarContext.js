(function($) {
	
	var VarContext = $.wiredui.VarContext = function VarContext(data) {
		var isObservable = $.isFunction(data) && data.__observable !== undefined;
		if( ! isObservable)
			throw "VarContext instance can only be created for observable data";
			
		this.data = data;
	} 
	
	VarContext.prototype.copy = function() {
		var copiedData = {};
		
		for (var i in this.data()) {
			copiedData[i] = this.data()[i];
		}
		
		return new VarContext($.observable(copiedData));
	}
	
})(jQuery);
