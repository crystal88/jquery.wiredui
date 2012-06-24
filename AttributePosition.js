(function($) {

    /**
     * Contains information about the position of a NodeController appearing in a DOM attribute.
     *
     * @class
     */
	var AttributePosition = $.wiredui.AttributePosition = function(elem, attrName) {

        /**
         * The DOM element which contains the attribute which the controller belongs to.
         *
         * @type DOMElem
         */
		this.origParentElem = elem;

        /**
         * The name of the attribute the controller should affect.
         *
         * @type {*}
         */
		this.attrName = attrName;

        /**
         * RunID => DOMElem pairs where the DOM elem is the elem containing the attribute which'
         * value the controller should affect.
         *
         * @type {Object}
         */
        this.parentElems = {};
	}
	
})(jQuery);
