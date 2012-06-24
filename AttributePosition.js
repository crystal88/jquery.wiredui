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
         * @type String
         */
		this.attrName = attrName;

        /**
         * RunID => DOMElem pairs where the DOM elem is the elem containing the attribute which'
         * value the controller should affect.
         *
         * @type {Object}
         */
        this.parentElems = {};

        /**
         * An optional plain text fragment preceding the output of the node controller.
         * When the attribute value is re-evaluated then this string must be exactly
         * before the node controller output.
         *
         * @type String
         */
        this.htmlPrefix = null;

        /**
         * An optional plain text fragment after the output of the node controller.
         * When the attribute value is re-evaluated then this string must be exactly
         * after the node controller output.
         *
         * If there are more than one node controllers in an attribute then only the
         * last one can have a non-empty htmlSuffix.
         *
         * @type String
         */
        this.htmlSuffix = null;
	}
	
})(jQuery);
