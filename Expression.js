(function($) {
	
	var trim = function(token) {
		return token.replace(/\s+$/, '').replace(/^\s+/, '');
	}
	
	var Expression = $.wiredui.Expression = function( expr, dependencies ) {
		if ( $.isFunction( expr ) ) {
			if (undefined === dependencies)
				throw "dependencies must be an array";
			this.fn = expr;
			this.dependencies = dependencies;
			return;
		}
		var compiledExpr = Expression.buildExprFn( trim(expr) );
		if ( compiledExpr === null )
			throw "failed to compile expression '" + expr + "'";
		this.fn = compiledExpr.fn;
		if ( compiledExpr.dependencies ) { // literal expressions will never have dependencies
			this.dependencies = compiledExpr.dependencies;
		}
	};
	
	Expression.buildExprFn = function( expr ) {
		if (expr.charAt(0) == '(') {
			if (expr.charAt(expr.length - 1) !== ')') {
				return Expression.buildSimpleExpr(expr)
				throw "missing closing bracket in expression '" + expr + "'";
			}
			var simpleExpr = trim( expr.substr(1, expr.length - 2) );
			return Expression.buildExprFn( simpleExpr );
		}
		return Expression.buildSimpleExpr(expr);
	}
	
	Expression.buildSimpleExpr = function( expr ) {
		var builders = [Expression.buildLiteralExpr
			, Expression.buildVariableExpr
			, Expression.buildOperatorExpr];
		for ( var i = 0; i < builders.length; ++i ) {
			var candidate = builders[ i ] ( expr );
			if (candidate !== null )
				return candidate;
		}
		return null;
	};
	
	Expression.buildLiteralExpr = function( expr ) {
		var literalBuilders = [Expression.buildNullLiteralExpr
			, Expression.buildStringLiteralExpr
			, Expression.buildBooleanLiteralExpr
			, Expression.buildNumberLiteralExpr];
		for ( var i = 0; i < literalBuilders.length; ++i ) {
			var candidate = literalBuilders[i] ( expr );
			if (candidate !== null)
				return {
					fn: candidate,
				};
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
	
	Expression.buildVariableExpr = function( expr ) {
		if ( ! /^[a-zA-Z_][a-zA-Z0-9_]*(\s*\.\s*[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(expr) )
			return null;
		
		var propChain = expr.split('.');
		for ( var i = 0; i < propChain.length; ++i ) {
			propChain[ i ] = trim(propChain[ i ]);
		}
		
		return {
			fn: function(data) {
				var currObj = data;
				for ( var i = 0; i < propChain.length; ++i ) {
					if ( ! $.isFunction( currObj ) )
						throw "failed to evaluate expression: '" + expr + "'";
					var candidate = currObj() [ propChain[ i ] ];
					if (candidate === undefined)
						return undefined;
					currObj = candidate;
				}
				return currObj;
			},
			dependencies: [propChain]
		};
	}

	Expression.buildOperatorExpr = function( expr ) {
		var builders = [Expression.buildUnaryOperatorExpr, Expression.buildBinaryOperatorExpr];
		for ( var i = 0; i < builders.length; ++i ) {
			var candidate = builders[i] ( expr );
			if ( candidate !== null ) {
				return candidate;
			}
		}
		return null;
	};
	
	Expression.buildUnaryOperatorExpr = function( expr ) {
		var operandExpr = null;
		if ( expr.charAt(0) == '!' ) {
			operandExpr = expr.substr(1);
		} else if (expr.substr(0, 4) == 'not ') {
			operandExpr = trim(expr.substr(4));
		}
		if (null === operandExpr)
			return null;
			
		var operand = new Expression( operandExpr );
		
		return  {
			fn: function(data) {
				var operandVal = operand.evaluate( data );
				while ( $.isFunction(operandVal)) {
					operandVal = operandVal();
				}
				return ! operandVal;
			},
			dependencies: operand.dependencies
		};
	};
	
	Expression.buildBinaryOperatorExpr = function( expr ) {
		var openBracketCount = 0;
		var stringCloseChr = null;
		var escaped = false;
		var currentOperand = '';
		var operands = [];
		var operators = [];
		for ( var i = 0; i < expr.length; ++i ) {
			
			var chr = expr.charAt(i);
			
			if (chr == '(' && stringCloseChr === null) {
				++openBracketCount;
				currentOperand += chr;
				continue;
			}
			if (chr === ')' && stringCloseChr === null) {
				--openBracketCount;
				currentOperand += chr;
				continue;
			}
			if ( (chr === '"' || chr === "'") ) {
				currentOperand += chr;
				if ( stringCloseChr !== null ) { // we are in a string
					if ( chr === stringCloseChr ) {
						if ( escaped ) {
							escaped = false;
						} else {
							stringCloseChr = null;
						}
						continue;
					} else {
						escaped = false;
						continue;
					}
				} else {
					escaped = false;
					stringCloseChr = chr;
					continue;
				}
			}
			if ( chr == '\\' ) {
				currentOperand += chr;
				escaped = ! escaped;
				continue;
			}
			if ( openBracketCount > 0 ) {
				currentOperand += chr;
				continue;
			}
			var foundOperator = null;
			for (var j = 0; j < Expression.binaryOperators.length; ++j ) {
				var operator = Expression.binaryOperators[j];
				foundOperator = operator;
				for ( var opCharIdx = 0; opCharIdx < operator.length; ++opCharIdx ) {
					if (expr.length > (i + opCharIdx) 
							&& expr.charAt(i + opCharIdx) == operator.charAt(opCharIdx) ) {
						continue;
					}
					foundOperator = null;
				}
				if ( foundOperator !== null ) {
					foundOperator = operator;
					i += foundOperator.length - 1;
					break;
				}
			}
			
			if (foundOperator === null) {
				currentOperand += chr;
			} else {
				operands.push( currentOperand );
				operators.push( foundOperator );
				currentOperand = '';
			}
		}
		if (currentOperand !== '') {
			operands.push(currentOperand);
		}
		if (operands.length != operators.length + 1)
			throw "failed to compile expression '" + expr + "'";
			
		for ( i = 0; i < Expression.operatorPrecedence.length; ++i ) {
			var opsUnderResolv = Expression.operatorPrecedence[i];
			var operatorMatchFound = false;
			for (var operatorIdx = 0
					; operatorIdx < operators.length
					; ++operatorIdx) {
				var operator = operators[operatorIdx];
				var found = false;
				for (var j = 0; j < opsUnderResolv.length; ++j) {
					if ( opsUnderResolv[j] == operator ) {
						found = true; break;
					}
				}
				if (found) { // the operator should be processed
					
					var leftOperand = operands[operatorIdx];
					if ( ! $.isFunction(leftOperand.evaluate) ) {
						leftOperand = new Expression(leftOperand);
					}
					
					var rightOperand = operands[operatorIdx + 1];
					if ( ! $.isFunction(rightOperand.evaluate) ) {
						rightOperand = new Expression(rightOperand);
					}
					
					operators.splice(operatorIdx, (operatorIdx == 0 ? 1 : operatorIdx)); // no comment
					operands.splice(operatorIdx + 1, operatorIdx + 1);
					
					(function(leftOperand, operator, rightOperand) {
						
						operands[operatorIdx] = new Expression(
						function( data ) {
								return Expression.binaryOpExecutors[operator]
									(leftOperand.evaluate(data), rightOperand.evaluate(data) )
							},
							leftOperand.dependencies.concat(rightOperand.dependencies)
						);
						
					})(leftOperand, operator, rightOperand);
					--operatorIdx;
				}
			}
			if (operators.length == 0) {
				break;
			}
		}
		return operands[0];
	};
	
	// keep the operators ordered descending by length
	Expression.binaryOperators = ['==', '=', '<=', '>=', '<', '>', 'or', 'and', '||', '&&', '+', '*', '/', '%'];
	
	Expression.binaryOpExecutors = {
		'==': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a == b;
		},
		'=': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a == b;
		},
		'<=': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a <= b;
		},
		'+': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a + b;
		},
		'-': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a - b;
		},
		'*': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a * b;
		},
		'/': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a / b;
		},
		'%': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a % b;
		},
		'and': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a && b;
		},
		'&&': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a && b;
		},
		'or': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a || b;
		},
		'||': function(a, b) {
			while ( $.isFunction(a) ) {
				a = a();
			};
			while ($.isFunction(b) ) {
				b = b();
			}
			return a || b;
		}
	};
	
	Expression.operatorPrecedence = [
		['*', '/', '%'],
		['+', '-'],
		['<=', '>=', '<', '>'],
		['==', '='],
		['and', '&&'],
		['or', '||']
	];
	
	Expression.prototype.fn = null;
	
	Expression.prototype.evaluate = function(data) {
		return this.fn(data);
	};
	
	Expression.prototype.dependencies = [];
	
})(jQuery);
