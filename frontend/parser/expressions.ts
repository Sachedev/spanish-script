import { error, ErrorType } from '../../error/error_manager.ts'
import { Property } from '../ast.ts'
import { Expression, Identifier, ParameterDeclaration } from '../ast.ts'
import { Token, TokenType } from '../lexer.ts'
import { eof, expectToken, shift, unexpectToken } from './parser.ts'
import { Statements } from './statements.ts'

export class ExpressionsParser {
  /**
   * This function parses an expression
   * @param tokens Are the tokens to parse
   * @returns Return an expression
   * @example
   * 10; // <-- expression
   * verdadero; // <-- expression
   * "Hola"; // <-- expression
   * nulo; // <-- expression
   * (10 + 20); // <-- expression
   * foo.bar(); // <-- expression
   * foo(10); // <-- expression
   */
  static parseExpression(tokens: Token[]): Expression {
    return this.parseAssignmentExpression(tokens)
  }

  /**
   * This function parses an assignment expression
   * @param tokens Are the tokens to parse
   * @returns Return an assignment expression
   * @example
   * foo = 10; // <-- assignment expression
   * foo.bar = 10; // <-- assignment expression
   */
  static parseAssignmentExpression(tokens: Token[]): Expression {
    const left = this.parseObjectLiteral(tokens)
    if (eof(tokens)) return left
    if (left.type !== 'Identifier' && left.type !== 'MemberExpression')
      return left
    if (tokens[0].value !== '=') return left
    unexpectToken(TokenType.EQUALS)
    const right = this.parseExpression(tokens)

    return {
      type: 'AssignmentExpression',
      operator: '=',
      left,
      right,
      start: left.start,
      end: right.end,
    }
  }

  /**
   * This function parses an object literal
   * @param tokens Are the tokens to parse
   * @returns Return an object literal
   * @example
   * { // <-- object literal
   *   foo: 10,
   *   bar: 20,
   * } // <-- object literal
   */
  static parseObjectLiteral(tokens: Token[]): Expression {
    if (tokens[0].type !== TokenType.OPEN_BRACE) {
      return this.parseFunctionLiteral(tokens)
    }
    const { start } = unexpectToken(TokenType.OPEN_BRACE)

    const properties: Property[] = []

    while ((tokens[0].type as TokenType) !== TokenType.CLOSE_BRACE) {
      const key = this.parsePrimaryExpression(tokens) as Identifier

      if (key.type !== 'Identifier') {
        error.printError(
          ErrorType.SyntaxError,
          'Se esperaba un identificador o un member expression pero se encontró ' +
            tokens[0].type,
          tokens[0].start
        )
      }

      if ((tokens[0].type as TokenType) === TokenType.COLON) {
        unexpectToken(TokenType.COLON)
        const value = this.parseExpression(tokens)
        properties.push({
          type: 'Property',
          key,
          value,
          start: key.start,
          end: value.end,
        })
        if ((tokens[0].type as TokenType) !== TokenType.CLOSE_BRACE) {
          expectToken(
            TokenType.COMMA,
            'Entre cada propiedad de un objeto se espera una coma.'
          )
        }
        continue
      } else {
        properties.push({
          type: 'Property',
          key,
          start: key.start,
          end: key.end,
        })
        if ((tokens[0].type as TokenType) !== TokenType.CLOSE_BRACE) {
          expectToken(
            TokenType.COMMA,
            'Entre cada propiedad de un objeto se espera una coma.'
          )
        }
      }
    }

    const { end } = expectToken(
      TokenType.CLOSE_BRACE,
      'Al final de un objeto se espera un paréntesis de cierre "}".'
    )

    return {
      type: 'ObjectLiteral',
      properties,
      start,
      end,
    }
  }

  /**
   * This function parses a function literal
   * @param tokens Are the tokens to parse
   * @returns Return a function literal
   * @example
   * const sumar = fun (Numero a, Numero b) { // <-- function literal
   *   devolver a + b;
   * }
   */
  static parseFunctionLiteral(tokens: Token[]): Expression {
    if (tokens[0].type !== TokenType.FUN) {
      return this.parseBinaryExpression(tokens)
    }
    const { start } = expectToken(TokenType.FUN, 'Se esperaba una función.')
    unexpectToken(TokenType.OPEN_PAREN)
    const params: ParameterDeclaration[] = []
    while ((tokens[0].type as TokenType) !== TokenType.CLOSE_PAREN) {
      unexpectToken(TokenType.IDENTIFIER, false)
      const type = this.parsePrimaryExpression(tokens) as Identifier
      unexpectToken(TokenType.IDENTIFIER, false)
      const param = this.parsePrimaryExpression(tokens) as Identifier
      params.push({
        type: 'ParameterDeclaration',
        identifier: param,
        typeAnnotation: type,
        start: param.start,
        end: param.end,
      })
      if ((tokens[0].type as TokenType) !== TokenType.CLOSE_PAREN) {
        expectToken(
          TokenType.COMMA,
          'Entre cada parámetro de una función se espera una coma.'
        )
      }
    }
    const { end } = expectToken(
      TokenType.CLOSE_PAREN,
      'Al final de una declaración de función se espera un paréntesis de cierre ")".'
    )

    const body = Statements.parseBlockStatement(tokens, 'function_block')

    return {
      type: 'FunctionLiteral',
      params,
      body,
      start,
      end,
    }
  }

  /**
   * This function parses a binary expression
   * @param tokens Are the tokens to parse
   * @returns Return a binary expression
   * @example
   * 10 + 20; // <-- binary expression
   * 10 > 20; // <-- binary expression
   */
  static parseBinaryExpression(tokens: Token[]): Expression {
    return this._parseLogicalExpression(tokens)
  }

  //#region parseBinaryExpression
  /**
   * This function parses a logical expression
   * @param tokens Are the tokens to parse
   * @returns Return a logical expression
   * @example
   * 10 y 20; // <-- logical expression
   * 10 o 20; // <-- logical expression
   */
  static _parseLogicalExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(
      tokens,
      [TokenType.Y, TokenType.O],
      (tokens: Token[]) => {
        return this._parseEqualityExpression(tokens)
      }
    )
  }

  /**
   * This function parses an equality expression
   * @param tokens Are the tokens to parse
   * @returns Return an equality expression
   * @example
   * 10 == 20; // <-- equality expression
   * 10 != 20; // <-- equality expression
   */
  static _parseEqualityExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(
      tokens,
      ['==', '!='],
      (tokens: Token[]) => {
        return this._parseRelationalExpression(tokens)
      }
    )
  }

  /**
   * This function parses a relational expression
   * @param tokens Are the tokens to parse
   * @returns Return a relational expression
   * @example
   * 10 > 20; // <-- relational expression
   * 10 >= 20; // <-- relational expression
   */
  static _parseRelationalExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(
      tokens,
      ['>', '>=', '<', '<='],
      (tokens: Token[]) => {
        return this._parseAdditiveExpression(tokens)
      }
    )
  }

  /**
   * This function parses an additive expression
   * @param tokens Are the tokens to parse
   * @returns Return an additive expression
   * @example
   * 10 + 20; // <-- additive expression
   * 10 - 20; // <-- additive expression
   */
  static _parseAdditiveExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(
      tokens,
      ['+', '-'],
      (tokens: Token[]) => {
        return this._parseMultiplicativeExpression(tokens)
      }
    )
  }

  /**
   * This function parses a multiplicative expression
   * @param tokens Are the tokens to parse
   * @returns Return a multiplicative expression
   * @example
   * 10 * 20; // <-- multiplicative expression
   * 10 / 20; // <-- multiplicative expression
   */
  static _parseMultiplicativeExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(
      tokens,
      ['*', '/', '%'],
      (tokens: Token[]) => {
        return this._parsePowerativeExpression(tokens)
      }
    )
  }

  /**
   * This function parses a powerative expression
   * @param tokens Are the tokens to parse
   * @returns Return a powerative expression
   * @example
   * 10 ^ 20; // <-- powerative expression
   */
  static _parsePowerativeExpression(tokens: Token[]): Expression {
    return parseUniqueBinaryExpression(tokens, ['^'], (tokens: Token[]) => {
      return this.parseCallExpression(tokens)
    })
  }
  //#endregion

  /**
   * This function parses a call expression
   * @param tokens Are the tokens to parse
   * @returns Return a call expression
   * @example
   * foo(); // <-- call expression
   * foo(10); // <-- call expression
   */
  static parseCallExpression(tokens: Token[]): Expression {
    const callee = this.parseMemberExpression(tokens)
    if (tokens[0].type !== TokenType.OPEN_PAREN) {
      return callee
    }
    unexpectToken(TokenType.OPEN_PAREN)
    const args: Expression[] = []
    while ((tokens[0].type as TokenType) !== TokenType.CLOSE_PAREN) {
      args.push(this.parseExpression(tokens))
      if ((tokens[0].type as TokenType) !== TokenType.CLOSE_PAREN) {
        expectToken(
          TokenType.COMMA,
          'Entre cada argumento de una función se espera una coma.'
        )
      }
    }
    const { end } = unexpectToken(TokenType.CLOSE_PAREN)

    return {
      type: 'CallExpression',
      callee,
      arguments: args,
      start: callee.start,
      end,
    }
  }

  /**
   * This function parses a member expression
   * @param tokens Are the tokens to parse
   * @param obj Is the object to parse
   * @returns Return a member expression
   * @example
   * foo.bar["10"]; // <-- member expression
   */
  static parseMemberExpression(tokens: Token[], obj?: Expression): Expression {
    let left = obj ?? this.parsePrimaryExpression(tokens)
    if (eof(tokens)) return left
    if (tokens[0].value !== '.' && tokens[0].value !== '[') return left
    if (!obj && left.type !== 'Identifier') {
      error.printError(
        ErrorType.SyntaxError,
        'Se espera que el objeto sea un identificador.',
        tokens[0].start
      )
    }
    while (
      tokens[0].type === TokenType.DOT ||
      tokens[0].type === TokenType.OPEN_BRACKET
    ) {
      const operator = shift()!.value as '.' | '['
      const computed = operator === '['
      let property: Expression

      if (computed) {
        // foo["bar"]
        const prop = this.parseExpression(tokens)
        unexpectToken(TokenType.CLOSE_BRACKET)
        property = this.parseMemberExpression(tokens, prop)
      } else {
        // foo.bar
        property = this.parseMemberExpression(tokens)
      }
      left = {
        type: 'MemberExpression',
        object: left as Identifier,
        property,
        computed,
        start: left.start,
        end: property.end,
      }
    }

    return left
  }

  /**
   * This function parses a primary expression
   * @param tokens Are the tokens to parse
   * @returns Return a primary expression
   * @example
   * 10; // <-- primary expression
   * falso; // <-- primary expression
   * "Hola"; // <-- primary expression
   * nulo; // <-- primary expression
   * foo; // <-- primary expression
   * (10 + 20); // <-- primary expression
   */
  static parsePrimaryExpression(tokens: Token[]): Expression {
    const token = tokens[0]

    switch (token.type) {
      case TokenType.IDENTIFIER:
        return {
          type: 'Identifier',
          name: shift()!.value,
          start: token.start,
          end: token.end,
        }
      case TokenType.NUMBER:
        return {
          type: 'NumericLiteral',
          value: Number(shift()!.value),
          start: token.start,
          end: token.end,
        }
      case TokenType.TEXT:
        return {
          type: 'StringLiteral',
          value: shift()!.value,
          start: token.start,
          end: token.end,
        }
      case TokenType.OPEN_PAREN: {
        shift()
        const expression = this.parseExpression(tokens)
        unexpectToken(TokenType.CLOSE_PAREN)
        return expression
      }
      default:
        error.printError(
          ErrorType.SyntaxError,
          `Se esperaba un literal, un identificador o un paréntesis pero se encontró ${tokens[0].type}`,
          tokens[0].start
        )
        throw ''
    }
  }
}

function parseUniqueBinaryExpression(
  tokens: Token[],
  symbol: (string | TokenType)[],
  parse: (tokens: Token[]) => Expression
): Expression {
  let left = parse(tokens)
  if (eof(tokens)) return left
  while (symbol.includes(tokens[0].value) || symbol.includes(tokens[0].type)) {
    const operator = shift()!.value as '+'
    const right = parse(tokens)
    left = {
      type: 'BinaryExpression',
      operator,
      left,
      right,
      start: left.start,
      end: right.end,
    }

    if (eof(tokens)) return left
  }
  return left
}
