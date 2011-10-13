(function($) {
	
	var trim = function(token) {
		return token.replace(/\s+$/, '').replace(/^\s+/, '');
	}
	
	var TokenStream = function(str) {
		this.str = str;
		this.inputStrLen = str.length;
	}
	
	TokenStream.prototype.idx = 0;

	TokenStream.prototype.inputStrLen = 0;
	
	TokenStream.prototype.lineIdx = 1;
	
	TokenStream.prototype.currentContext = 'html';
	
	TokenStream.prototype.read = function() {
		var str = this.str;
		this.currentContext = 'html';
		var token = '';
		var next = null;
		if ( this.idx >= this.inputStrLen )
			return null;
			
		var chr = str[this.idx];
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
				chr = str[this.idx];
			
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
	
	TokenStream.prototype.readAll = function() {
		var rval = new Array();
		var token = null;
		while ( (token = this.read()) !== null ) {
			rval.push(token);
		}
		return rval;
	}
	
	TokenStream.prototype.nextChar = function() {
		if ( this.idx >= this.inputStrLen - 1 )
			return null;
		return this.str[this.idx + 1];
	}
	
	TokenStream.prototype.invalidChar = function(chr) {
		throw "invalid character '" + chr + "' at line " + this.lineIdx;
	}
	
	TokenStream.prototype.raiseError = function(message) {
		throw message + " at line " + this.lineIdx;
	}
	
	var NodeController = function() {
		
	};
	
	NodeController.factory = function(tokenObj, tokenstream, scopeData) {
		switch( tokenObj.type ) {
			case 'html':
				return new HTMLNodeController( tokenObj, tokenstream );
			case 'output':
				return new OutputNodeController( tokenObj, tokenstream, scopeData );
			case 'stmt':
				return StatementNodeController.factory( tokenObj, tokenstream, scopeData );
			default:
				throw "unknown token type: " + tokekObj.type;
		}
	};
	
	var HTMLNodeController = function( tokenObj, tokenstream ) {
		this.block = [ tokenObj.token ];
	};
	
	HTMLNodeController.prototype = new NodeController();
	
	HTMLNodeController.prototype.block = null;
	
	var OutputNodeController = function( tokenObj, tokenstream, scopeData ) {
		this.expression = new Expression(tokenObj);
		
	};
	
	OutputNodeController.prototype = new NodeController();
	
	var StatementNodeController = function() {};
	
	StatementNodeController.prototype.block = [];
	
	StatementNodeController.factory = function( tokenObj, tokenstream, scopeData ) {
		var str = tokenObj.token;
		var firstSpacePos = str.indexOf(" ");
		var stmtWord = str.substr(0, firstSpacePos);
		var remaining = str.substr(firstSpacePos);
		switch( stmtWord ) {
			case 'if':
				return new IfStatementNodeController( remaining, tokenstream, scopeData );
			case 'elseif':
			case 'elif':
			case 'elsif':
				return new ElseIfStatementNodeController( remaining, tokenstream, scopeData );
			case 'else':
				return new ElseStatementNodeController( remaining, tokenstream, scopeData );
			case 'each':
				return new EachStatementNodeController( remaining, tokenstream, scopeData );
		}
	}
	
	StatementNodeController.prototype = new NodeController();
	
	var IfStatementNodeController = function( condition, tokenstream, scopeData ) {
		
	}
	
	IfStatementNodeController.prototype = new StatementNodeController();
	
	var ElseIfStatementNodeController = function( condition, tokenstream, scopeData ) {
		
	}
	
	ElseIfStatementNodeController.prototype = new StatementNodeController();
	
	var ElseStatementNodeController = function( remaining, tokenstream, scopeData ) {
		if (remaining)
			tokenstream.raiseError("unexpected '" + remaining + "'");
		this.block = readTree(tokenstream, scopeData, {type: 'stmt', token: '/if'}
			, [{type: 'stmt', token: '/each'}]);
	}
	
	ElseStatementNodeController.prototype = new StatementNodeController();
	
	
	
	var readTree = function(tokenstream, data, readUntil, disabledTokens) {
		if ( undefined === readUntil ) {
			readUntil = null;
		}
		var token;
		var rval = [];
		if ( ! disabledTokens ) {
			while ( (token = tokenstream.read()) !== null ) { // no disabled tokens, simple reading
				if (token === readUntil)
					break;
				rval.push( NodeController.factory(token, tokenstream, data) );
			}
		} else {
			if ( ! $.isArray(disabledTokens) )
				throw "disabledTokens must be an array or null";
			
			while ( (token = tokenstream.read()) !== null ) { // no disabled tokens, simple reading
				if (token === readUntil)
					break;
				for (var i = 0; i < disabledTokens.length; ++i ) {
					if (disabledToken[ i ] == token) {
						tokenstream.raiseError("unexpected " + token);
					}
				}
				rval.push( NodeController.factory(token, tokenstream, data) );
			}
		}
		return rval;
	}
	
	$.fn.binddata = function(data) {
		readTree(new TokenStream(this[0].innerHTML), data);
	}
	
	var Expression = function( expr, scopeData ) {
		this.fn = Expression.buildExprFn( trim(expr) );
	};
	
	Expression.buildExprFn = function( expr ) {
		if (expr.charAt(0) == '(') {
			if (expr.charAt(expr.length - 1) !== ')') {
				throw "missing closing bracket in expression '" + expr + "'";
			}
			var simpleExpr = trim( expr.substr(1, expr.length - 1) );
			return Expression.buildSimpleExpr( simpleExpr );
		}
		return Expression.buildSimpleExpr( trim(expr) );
	}
	
	Expression.buildSimpleExpr = function( expr ) {
		var literalExpr = Expression.buildLiteralExpr( expr );
		if (literalExpr !== null)
			return literalExpr;
		
		return function() {
			return null;
		}
	};
	
	Expression.buildLiteralExpr = function( expr ) {
		var literalBuilders = [Expression.buildNullLiteralExpr
			, Expression.buildStringLiteralExpr
			, Expression.buildBooleanLiteralExpr
			, Expression.buildNumberLiteralExpr];
		for ( var i = 0; i < literalBuilders.length; ++i ) {
			var candidate = literalBuilders[i] ( expr );
			if (candidate !== null)
				return candidate;
		}
		return null;
	}
	
	Expression.buildStringLiteralExpr = function( expr ) {
		var firstChar = expr.charAt(0);
		var lastChar = expr.charAt(expr.length - 1);
		if ( (firstChar === '"' && lastChar === '"')
			|| (firstChar === "'" && lastChar === "'") ) {
			
			var terminator = firstChar;
			var escaped = false;
			for (var i = 1; i < expr.length - 1; ++i ) {
				var chr = expr.charAt(i);
				if ( chr === '\\' ) {
					escaped = ! escaped;
					continue;
				}
				if ( chr === terminator && ! escaped ) { // an unescaped string identifier found in the middle of the string - it can't be a string literal
					return null;
				}
			}
			var rval = expr.substr(1, expr.length - 2);
			return function() {
				return rval;
			}
		} else {
			return null;
		}
	}
	
	Expression.buildNullLiteralExpr = function(expr) {
		if (expr.toLowerCase() !== 'null') // it's not a null literal
			return null;
		return function() {
			return null;
		}
	}
	
	Expression.buildBooleanLiteralExpr = function( expr ) {
		expr = expr.toLowerCase();
		if ( expr === 'true' ) {
			return function() {
				return true;
			}
		}
		if ( expr === 'false' ) {
			return function() {
				return false;
			}
		}
		return null;
	}
	
	Expression.buildNumberLiteralExpr = function( expr ) {
		var candidate = new Number(expr);
		if ( isNaN(candidate) )
			return null;
		return function() {
			return candidate;
		}
	}
	
	Expression.prototype.fn = null;
	
	Expression.prototype.evaluate = function() {
		return this.fn();
	};
	
	Expression.prototype.dependencies = [];
		
	/**
	 * Exploding some classes for unit testing
	 */
	$.binddata = {
		TokenStream: TokenStream,
		Expression: Expression
	};
	
})(jQuery);
