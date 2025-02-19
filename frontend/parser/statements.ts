import { error, ErrorType } from '../../error/error_manager.ts'
import {
  BreakStatement,
  ContinueStatement,
  Expression,
  FunctionDeclaration,
  Identifier,
  ParameterDeclaration,
  WhileStatement,
} from '../ast.ts'
import {
  BlockKind,
  BlockStatement,
  IfStatement,
  Node,
  Statement,
} from '../ast.ts'
import { Token, TokenType } from '../lexer.ts'
import { ExpressionsParser } from './expressions.ts'
import {
  unexpectToken,
  parserExpectedError,
  oldExpectToken,
  shift,
  expectToken,
} from './parser.ts'

export class Statements {
  static parseStatement(tokens: Token[]): Statement {
    switch (tokens[0].type) {
      case TokenType.VAR:
      case TokenType.CONST:
        return this.parseVariableDeclaration(tokens)
      case TokenType.FUN: {
        if (tokens[1].type === TokenType.IDENTIFIER) {
          return this.parseFunctionDeclaration(tokens)
        } else {
          return this.parseExpressionStatement(tokens)
        }
      }
      case TokenType.DEVOLVER:
        return this.parseReturnStatement(tokens)
      case TokenType.SI:
        return this.parseIfStatement(tokens)
      case TokenType.PERO_SI:
      case TokenType.SINO:
        error.printError(
          ErrorType.SyntaxError,
          'No se permite usar pero_si y sino fuera de una declaración condicional si.',
          tokens[0].start
        )

        throw ''
      case TokenType.MIENTRAS:
        return this.parseWhileStatement(tokens)
      case TokenType.ROMPER:
        return this.parseBreakStatement(tokens)
      case TokenType.CONTINUAR:
        return this.parseContinueStatement(tokens)
      default: {
        return this.parseExpressionStatement(tokens)
      }
    }
  }

  /**
   * This function parses an expression statement
   * @param tokens Are the tokens to parse
   * @returns Return an expression statement
   * @example
   * "Hola Mundo"; // <-- expression statement
   */
  static parseExpressionStatement(tokens: Token[]): Statement {
    const expression = ExpressionsParser.parseExpression(tokens)

    return {
      type: 'ExpressionStatement',
      expression,
      start: expression.start,
      end: this._parseEndStatement().end,
    }
  }

  /**
   * This function parses a variable declaration
   * @param tokens Are the tokens to parse
   * @returns Return a variable declaration
   * @example
   * var var_1 = 1;  // <-- variable declaration
   * var var_2: Numero = 2;  // <-- variable declaration
   * var var_3: Texto;  // <-- variable declaration
   *
   * const const_1 = 1;  // <-- constant declaration
   * const const_2: Numero = 2;  // <-- constant declaration
   */
  static parseVariableDeclaration(tokens: Token[]): Statement {
    // (var|const) identifier = expression;
    // (var|const) Type identifier = expression;
    // var Type identifier;
    const keyword = shift()!
    const kind = keyword.value as 'var' | 'const'

    unexpectToken(TokenType.IDENTIFIER, false) // identifier
    const identifier = ExpressionsParser.parsePrimaryExpression(
      tokens
    ) as Identifier

    let typeAnnotation: Identifier | undefined
    if (tokens[0].type === TokenType.COLON) {
      unexpectToken(TokenType.COLON) // :
      const type = ExpressionsParser.parsePrimaryExpression(
        tokens
      ) as Identifier // Type
      typeAnnotation = type
    }

    let value: Expression | undefined
    if (tokens[0].type === TokenType.EQUALS) {
      unexpectToken(TokenType.EQUALS) // =
      value = ExpressionsParser.parseExpression(tokens) // expression
    } else if (!typeAnnotation) {
      return error.printError(
        ErrorType.SyntaxError,
        'No se puede declarar una variable sin valor sin un tipo.',
        identifier.start,
        identifier.end
      )
    }

    const { end } = this._parseEndStatement() // ;

    return {
      type: 'VariableDeclaration',
      kind,
      typeAnnotation,
      identifier,
      value,
      start: keyword.start,
      end,
    }
  }

  /**
   * This function parses a function declaration
   * @param tokens Are the tokens to parse
   * @returns Return a function declaration
   * @example
   * fun sumar(Numero a, Numero b) {
   *   devolver a + b;
   * } // <-- function declaration
   */
  static parseFunctionDeclaration(tokens: Token[]): FunctionDeclaration {
    const keyword = shift()!

    expectToken(
      TokenType.IDENTIFIER,
      'No se pudo determinar el nombre de la función.',
      false
    )
    const identifier = ExpressionsParser.parsePrimaryExpression(
      tokens
    ) as Identifier

    expectToken(
      TokenType.OPEN_PAREN,
      'Después del nombre de la función se esperaba un paréntesis de apertura.'
    )
    const params: ParameterDeclaration[] = []
    while (tokens[0].type !== TokenType.CLOSE_PAREN) {
      expectToken(
        TokenType.IDENTIFIER,
        'No se pudo determinar el nombre del parámetro.',
        false
      )
      const param = ExpressionsParser.parsePrimaryExpression(
        tokens
      ) as Identifier
      expectToken(
        TokenType.COLON,
        'Después del nombre del parámetro se esperaba un signo de dos puntos (:).'
      )
      expectToken(
        TokenType.IDENTIFIER,
        'No se pudo determinar el tipo del parámetro.',
        false
      )
      const type = ExpressionsParser.parsePrimaryExpression(
        tokens
      ) as Identifier
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
          'Entre cada parámetro de una función se espera una coma (,).'
        )
      }
    }
    expectToken(
      TokenType.CLOSE_PAREN,
      'Al final de una declaración de función se espera un paréntesis de cierre ")".'
    )

    expectToken(
      TokenType.COLON,
      'Después del paréntesis de apertura se esperaba un signo de dos puntos (:).'
    )
    expectToken(
      TokenType.IDENTIFIER,
      'No se pudo determinar el tipo que devuelve de la función.',
      false
    )
    const returnType = ExpressionsParser.parsePrimaryExpression(
      tokens
    ) as Identifier

    const body: Node = Statements.parseBlockStatement(tokens, 'function_block')

    return {
      type: 'FunctionDeclaration',
      id: identifier,
      params,
      returnType,
      body,
      start: keyword.start,
      end: body.end,
    }
  }

  /**
   * This function parses a return statement
   * @param tokens Are the tokens to parse
   * @returns Return a return statement
   * @example
   * fun saludar(Texto nombre) {
   *   devolver "Hola" + nombre; // <-- return statement
   * }
   */
  static parseReturnStatement(tokens: Token[]): Statement {
    const { start } = unexpectToken(TokenType.DEVOLVER)
    const argument = ExpressionsParser.parseExpression(tokens)
    const { end } = this._parseEndStatement()

    return {
      type: 'ReturnStatement',
      argument,
      start,
      end,
    }
  }

  /**
   * This function parses an if statement
   * @param tokens Are the tokens to parse
   * @param kind Is the keyword of the if statement
   * @returns Return an if statement
   * @example
   * si (10 > 5) { // <-- if statement
   *   imprimir("10 es mayor que 5");
   * } pero_si (10 == 5) { // <-- if statement
   *   imprimir("10 es igual a 5");
   * } sino {
   *   imprimir("10 es menor que 5");
   * }
   */
  static parseIfStatement(
    tokens: Token[],
    kind: 'si' | 'pero_si' = 'si'
  ): IfStatement {
    const keyword = shift()! // 'si' | 'pero_si'
    if (keyword.value !== kind) {
      parserExpectedError(
        keyword,
        kind === 'si' ? TokenType.SI : TokenType.PERO_SI
      )
    }
    unexpectToken(TokenType.OPEN_PAREN)
    const condition = ExpressionsParser.parseExpression(tokens)
    unexpectToken(TokenType.CLOSE_PAREN)
    const consequent = this.parseBlockStatement(tokens, 'if_block')

    let alternate: BlockStatement | IfStatement | undefined
    if (tokens[0].type === TokenType.SINO) {
      shift()
      alternate = Statements.parseBlockStatement(tokens, 'if_block')
    } else if (tokens[0].type === TokenType.PERO_SI) {
      alternate = Statements.parseIfStatement(tokens, 'pero_si')
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      start: keyword.start,
      end: alternate?.end ?? consequent.end,
    }
  }

  /**
   * This function parses a block statement
   * @param tokens Are the tokens to parse
   * @param kind Is the kind of the block statement
   * @returns Return a block statement
   * @example
   * { // <-- block statement
   *   imprimir("Hola");
   *   imprimir("Mundo");
   * } // <-- block statement
   */
  static parseBlockStatement(tokens: Token[], kind: BlockKind): BlockStatement {
    const { start } = unexpectToken(TokenType.OPEN_BRACE)
    const body: Node[] = []
    while (tokens[0].type !== TokenType.CLOSE_BRACE) {
      body.push(Statements.parseStatement(tokens))
    }
    const { end } = unexpectToken(TokenType.CLOSE_BRACE)

    return {
      type: 'BlockStatement',
      kind,
      body,
      start,
      end,
    }
  }

  /**
   * This function parses a while statement
   * @param tokens Are the tokens to parse
   * @returns Return a while statement
   * @example
   * mientras (10 > 5) hacer { // <-- while statement
   *   imprimir("Hola");
   * }
   */
  static parseWhileStatement(tokens: Token[]): WhileStatement {
    const { start } = unexpectToken(TokenType.MIENTRAS)
    unexpectToken(TokenType.OPEN_PAREN)
    const condition = ExpressionsParser.parseExpression(tokens)
    unexpectToken(TokenType.CLOSE_PAREN)
    unexpectToken(TokenType.HACER)
    const body = Statements.parseBlockStatement(tokens, 'while_block')

    return {
      type: 'WhileStatement',
      condition,
      body,
      start,
      end: body.end,
    }
  }

  /**
   * This function parses a break statement
   * @param _tokens Are the tokens to parse
   * @returns Return a break statement
   * @example
   * mientras (10 > 5) hacer {
   *   si (10 == 5) {
   *     romper; // <-- break statement
   *   }
   * }
   */
  static parseBreakStatement(_tokens: Token[]): BreakStatement {
    const { start } = unexpectToken(TokenType.ROMPER)
    const { end } = this._parseEndStatement()
    return {
      type: 'BreakStatement',
      start,
      end,
    }
  }

  /**
   * This function parses a continue statement
   * @param _tokens Are the tokens to parse
   * @returns Return a continue statement
   * @example
   * mientras (10 > 5) hacer {
   *   si (10 == 5) {
   *     continuar; // <-- continue statement
   *   }
   * }
   */
  static parseContinueStatement(_tokens: Token[]): ContinueStatement {
    const { start } = unexpectToken(TokenType.CONTINUAR)
    const { end } = this._parseEndStatement()
    return {
      type: 'ContinueStatement',
      start,
      end,
    }
  }

  /**
   * Expects a semicolon at the end of a statement
   * @returns Returns the semicolon token
   * @example
   * const a = 10; // <-- semicolon
   */
  static _parseEndStatement(): Token {
    return oldExpectToken(
      TokenType.SEMICOLON,
      'Se esperaba un punto y coma al final de la declaración.'
    )
  }
}
