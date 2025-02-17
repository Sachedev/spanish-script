import { error, ErrorType } from '../../error/error_manager.ts'
import { Program } from '../ast.ts'
import { Token, tokenize, TokenType } from '../lexer.ts'
import { Statements } from './statements.ts'

let tokens: Token[] = []

export default class Parser {
  parseProgram(): Program {
    const program: Program = {
      type: 'Program',
      body: [],
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 },
    }
    while (!eof(tokens)) {
      program.body.push(Statements.parseStatement(tokens))
    }
    program.end = tokens[0].end
    return program
  }

  parse(sourceCode: string, file?: string): Program {
    error.setCurrentFile(file)
    tokens = tokenize(sourceCode)

    return this.parseProgram()
  }
}

export function parserExpectedError(
  token: Token,
  expectedToken: TokenType
): never {
  error.printError(
    ErrorType.SyntaxError,
    `Se esperaba un ${expectedToken} pero se encontró ${token.type}`,
    token.start
  )
  throw ''
}

/** Verifica que el siguiente token sea el esperado, y lo elimina de la lista de tokens */
export function unexpectToken(expectedToken: TokenType, deleteToken = true) {
  if (tokens[0].type !== expectedToken) {
    parserExpectedError(tokens[0], expectedToken)
  }
  if (deleteToken) return shift()!
  return tokens[0]
}

export function expectToken(expectedToken: TokenType, message: string) {
  if (tokens[0].type !== expectedToken) {
    error.printError(
      ErrorType.SyntaxError,
      message,
      lastToken?.end ?? tokens[0].start
    )
  }
  return shift()!
}

export function eof(tokens: Token[]) {
  return tokens[0].type === TokenType.EOF
}

export let lastToken: Token | undefined

export function shift() {
  const token = tokens.shift()
  if (token) {
    lastToken = token
  }
  return token
}
