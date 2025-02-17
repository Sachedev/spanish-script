import { error, ErrorType } from '../error/error_manager.ts'

export type LogicalOperators = 'y' | 'o'
export type Comparators = '>' | '>=' | '<' | '<=' | '==' | '!='
export type Operators = '+' | '-' | '*' | '/' | '%' | '^'

export enum TokenType {
  // Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  // Keywords
  VAR = 'VAR', // var
  CONST = 'CONST', // const
  SI = 'SI', // si
  PERO_SI = 'PERO_SI', // pero_si
  SINO = 'SINO', // sino
  FUN = 'FUN', // fun
  DEVOLVER = 'DEVOLVER', // devolver
  MIENTRAS = 'MIENTRAS', // mientras
  HACER = 'HACER', // hacer
  ROMPER = 'ROMPER', // romper
  CONTINUAR = 'CONTINUAR', // continuar
  // Operators
  BYNARY_OPERATOR = 'BYNARY_OPERATOR', // + - * / % ^
  COMPARATOR = 'COMPARATOR', // > < >= <= == !=
  Y = 'Y', // y // &&
  O = 'O', // o // ||
  EQUALS = 'EQUALS', // =
  OPEN_PAREN = 'OPEN_PAREN', // (
  CLOSE_PAREN = 'CLOSE_PAREN', // )
  OPEN_BRACE = 'OPEN_BRACE', // {
  CLOSE_BRACE = 'CLOSE_BRACE', // }
  OPEN_BRACKET = 'OPEN_BRACKET', // [
  CLOSE_BRACKET = 'CLOSE_BRACKET', // ]
  // Punctuation
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  COLON = 'COLON', // :
  DOT = 'DOT', // .
  // Comments
  COMMENT = 'COMMENT', // //
  // End of file
  EOF = 'EOF', // EOF
}

export interface Token {
  type: TokenType
  value: string
  start: Location
  end: Location
}

export interface Location {
  line: number
  column: number
}

const KEYWORDS = {
  var: TokenType.VAR,
  const: TokenType.CONST,
  si: TokenType.SI,
  pero_si: TokenType.PERO_SI,
  sino: TokenType.SINO,
  fun: TokenType.FUN,
  devolver: TokenType.DEVOLVER,
  mientras: TokenType.MIENTRAS,
  hacer: TokenType.HACER,
  romper: TokenType.ROMPER,
  continuar: TokenType.CONTINUAR,
  y: TokenType.Y,
  o: TokenType.O,
}

function isAlpha(char?: string): boolean {
  if (!char) return false
  return char.toUpperCase() !== char.toLowerCase() || char === '_'
}
function isDigit(char?: string): boolean {
  if (!char) return false
  const code = char.charCodeAt(0)
  return code >= '0'.charCodeAt(0) && code <= '9'.charCodeAt(0)
}
function isSkippable(char?: string): boolean {
  if (!char) return false
  return char === ' ' || char === '\n' || char === '\t'
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  const src = input.split('')

  let line = 1
  let column = 1

  let lastChar: string | undefined

  const chars: string[] = []
  // error.addEventListener('error', () => {
  //   console.log(chars.join(''))
  // })

  const shift = () => {
    const char = src.shift()
    if (char === '\n' || char === '\r') {
      line += 1
      column = 1
    } else {
      column += 1
    }

    chars.push(char!)
    lastChar = char

    return char!
  }

  const token = (value: string, type: TokenType): Token => {
    return {
      type,
      value,
      start: {
        line,
        column: column - value.length,
      },
      end: {
        line,
        column,
      },
    }
  }

  while (src.length > 0) {
    // For more than one character
    // Strings
    if (src[0] === '"') {
      shift()
      let str = ''
      const loc = { line: line, column: column }
      while (src[0] !== '"') {
        if (src[0] == null) {
          error.printError(
            ErrorType.SyntaxError,
            'Se deben cerrar los textos con las comillas dobles ("texto").',
            loc
          )
        }

        if (src[0] === '\\') {
          shift()
          const strEscape = stringEscapes[src[0]]
          if (strEscape) {
            str += strEscape
            shift()
            continue
          }
        }
        str += shift()
      }
      shift()

      tokens.push(token(str, TokenType.TEXT))
      continue
    }
    // Alpha
    if (isAlpha(src[0])) {
      let str = ''
      while (isAlpha(src[0]) || isDigit(src[0])) {
        str += shift()
      }
      const tokenType = KEYWORDS[str as keyof typeof KEYWORDS]
      if (tokenType) {
        tokens.push(token(str, tokenType))
        continue
      }

      tokens.push(token(str, TokenType.IDENTIFIER))
      continue
    }
    // Digit
    if (
      isDigit(src[0]) ||
      (!isDigit(lastChar) && src[0] === '-' && isDigit(src[1]))
    ) {
      let str = src[0] === '-' ? shift() : ''
      while (isDigit(src[0]) || (src[0] === '.' && isDigit(src[1]))) {
        str += shift()
      }
      tokens.push(token(str, TokenType.NUMBER))
      continue
    }
    // Skippable
    if (isSkippable(src[0])) {
      shift()
      continue
    }

    // Multi character
    if (src[0] === '>' && src[1] === '=') {
      shift()
      shift()
      tokens.push(token('>=', TokenType.COMPARATOR))
      continue
    }
    if (src[0] === '<' && src[1] === '=') {
      shift()
      shift()
      tokens.push(token('<=', TokenType.COMPARATOR))
      continue
    }
    if (src[0] === '!' && src[1] === '=') {
      shift()
      shift()
      tokens.push(token('!=', TokenType.COMPARATOR))
      continue
    }
    if (src[0] === '=' && src[1] === '=') {
      shift()
      shift()
      tokens.push(token('==', TokenType.COMPARATOR))
      continue
    }

    if (src[0] === '/' && src[1] === '/') {
      shift()
      shift()
      while (
        (src[0] as string) !== '\n' &&
        (src[0] as string) !== '\r' &&
        (src[0] as string) !== '' &&
        (src[0] as string) != null
      ) {
        shift()
      }

      continue
    }
    if (src[0] === '/' && src[1] === '*') {
      let annidatedComment: number = 1
      shift()
      shift()

      while ((src[0] as string) != null && annidatedComment > 0) {
        if (src[0] + src[1] === '/*') {
          annidatedComment += 1
          shift()
          shift()
          continue
        }
        if (src[0] + src[1] === '*/') {
          annidatedComment -= 1
          shift()
          shift()
        }
        shift()
      }
      continue
    }

    // Single character

    if (src[0] === '>') {
      tokens.push(token(shift(), TokenType.COMPARATOR))

      continue
    }
    if (src[0] === '<') {
      tokens.push(token(shift(), TokenType.COMPARATOR))

      continue
    }
    if (src[0] === '=') {
      tokens.push(token(shift(), TokenType.EQUALS))

      continue
    }
    if (src[0] === '(') {
      tokens.push(token(shift(), TokenType.OPEN_PAREN))

      continue
    }
    if (src[0] === ')') {
      tokens.push(token(shift(), TokenType.CLOSE_PAREN))

      continue
    }
    if (src[0] === '{') {
      tokens.push(token(shift(), TokenType.OPEN_BRACE))

      continue
    }
    if (src[0] === '}') {
      tokens.push(token(shift(), TokenType.CLOSE_BRACE))

      continue
    }
    if (src[0] === '[') {
      tokens.push(token(shift(), TokenType.OPEN_BRACKET))

      continue
    }
    if (src[0] === ']') {
      tokens.push(token(shift(), TokenType.CLOSE_BRACKET))

      continue
    }
    if (src[0] === ':') {
      tokens.push(token(shift(), TokenType.COLON))

      continue
    }
    if (src[0] === ',') {
      tokens.push(token(shift(), TokenType.COMMA))

      continue
    }
    if (src[0] === '.') {
      tokens.push(token(shift(), TokenType.DOT))

      continue
    }
    if (src[0] === ';') {
      tokens.push(token(shift(), TokenType.SEMICOLON))

      continue
    }
    if (
      src[0] === '+' ||
      src[0] === '-' ||
      src[0] === '*' ||
      src[0] === '/' ||
      src[0] === '%' ||
      src[0] === '^'
    ) {
      tokens.push(token(shift(), TokenType.BYNARY_OPERATOR))

      continue
    }

    return error.printError(
      ErrorType.SyntaxError,
      `El carácter ${src[0]} no es válido.`,
      { line: line, column: column }
    )
  }

  tokens.push(token('EOF', TokenType.EOF))

  return tokens
}

const stringEscapes = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
  '"': '"',
  '\\': '\\',
}
