(function($) {
	
	var trim = function(token) {
		return token.replace(/\s+$/, '').replace(/^\s+/, '');
	}
	
	var TextElemParser = $.wiredui.TextElemParser = function(str) {
		this.str = str;
		this.inputStrLen = str.length;
		this.unprocessedStack = [];
		this.idx = 0;
	}
	
	TextElemParser.prototype.pushUnprocessed = function(token) {
		this.unprocessedStack.push(token);
	}
	
	TextElemParser.prototype.idx = 0;

	TextElemParser.prototype.inputStrLen = 0;
	
	TextElemParser.prototype.lineIdx = 1;
	
	TextElemParser.prototype.currentContext = 'html';
	
	TextElemParser.prototype.read = function() {
		if (this.unprocessedStack.length) {
			return this.unprocessedStack.pop();
		}
		var str = this.str;
		this.currentContext = 'html';
		var token = '';
		var next = null;
		if ( this.idx >= this.inputStrLen )
			return null;
			
		var chr = str.charAt( this.idx );
		if ( chr == '$' ) {
			if ( (next = this.nextChar()) !== '{' ) {
				this.invalidChar( next );
			}
			this.currentContext = 'output';
			this.idx += 2;
		} else if ( chr == '{' ) {
			if ( (next = this.nextChar()) !== '{' ) {
				this.invalidChar( next );
			}
			this.currentContext = 'stmt';
			this.idx += 2;
		} else { // handling HTML context in a different loop for faster execution
			for (; this.idx < this.inputStrLen; ++this.idx) {
				chr = str.charAt( this.idx );
			
				switch( chr ) {
					case "\n":
						++this.lineIdx;
						break;
					case '$':
					case '{':
						if ( (next = this.nextChar()) === '{' ) {
							return {
								type: this.currentContext,
								token: token
							};
						}
				}
				token += chr;
			}
			return {
				type: this.currentContext,
				token: token
			};
		}
		for (; this.idx < this.inputStrLen; ++this.idx) { // reading stmt and output context
			chr = str[this.idx];
			
			switch( chr ) {
				case "\n":
					++this.lineIdx;
					break;
				case "{":
					if ( this.currentContext !== 'html' ) {
						this.invalidChar( chr );
					}
					break;
				case "}":
					if ( this.currentContext == 'stmt') {
						if ( (next = this.nextChar()) !== '}' ) {
							this.invalidChar( chr );
						}
						this.idx += 2;
						return {
							type: this.currentContext,
							token: trim(token)
						};
						
					} else if ( this.currentContext == 'output' ) {
						++this.idx;
						return {
							type: this.currentContext,
							token: trim(token)
						};
					}
			}
			
			token += chr;
		}
		this.raiseError("incomplete expression at the end of template");
	}
	
	TextElemParser.prototype.readAll = function() {
		var rval = new Array();
		var token = null;
		while ( (token = this.read()) !== null ) {
			rval.push(token);
		}
		return rval;
	}
	
	TextElemParser.prototype.getUnread = function() {
		var rval = "";
		var token = null;
		while( (token = this.read()) !== null) {
			rval += token.token;
		}
		return rval;
	}
	
	TextElemParser.prototype.nextChar = function() {
		if ( this.idx >= this.inputStrLen - 1 )
			return null;
		return this.str[this.idx + 1];
	}
	
	TextElemParser.prototype.invalidChar = function(chr) {
		throw "invalid character '" + chr + "' at line " + this.lineIdx;
	}
	
	TextElemParser.prototype.raiseError = function(message) {
		throw message + " at line " + this.lineIdx;
	}
	
})(jQuery);
