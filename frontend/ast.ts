import { Comparators, Location, LogicalOperators, Operators } from './lexer.ts'

// Tipos base
export type Node = Statement | Expression

export interface BaseNode {
  type: string
  // Ubicación en el código
  start: Location
  end: Location
}

// ---------------------------
// **Statements** (Instrucciones que no producen valor)
// ---------------------------

export interface Program extends BaseNode {
  type: 'Program'
  body: Node[]
}

export interface VariableDeclaration extends BaseNode {
  type: 'VariableDeclaration'
  kind: 'var' | 'const'
  typeAnnotation?: Identifier
  identifier: Identifier
  value?: Expression
}

export interface ParameterDeclaration extends BaseNode {
  type: 'ParameterDeclaration'
  identifier: Identifier
  typeAnnotation: Identifier
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration'
  id: Identifier
  params: ParameterDeclaration[]
  body: BlockStatement
  returnType: Identifier
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement'
  condition: Expression
  consequent: BlockStatement
  alternate?: IfStatement | BlockStatement // `pero_si` o `sino`
}

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement'
  condition: Expression
  body: BlockStatement
}

export type BlockKind = 'function_block' | 'if_block' | 'while_block'
export interface BlockStatement extends BaseNode {
  type: 'BlockStatement'
  kind: BlockKind
  body: Node[]
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement'
  expression: Expression
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement'
  argument: Expression
}

export interface BreakStatement extends BaseNode {
  type: 'BreakStatement'
}

export interface ContinueStatement extends BaseNode {
  type: 'ContinueStatement'
}

// ---------------------------
// **Expressions** (Producen un valor)
// ---------------------------

export interface Identifier extends BaseNode {
  type: 'Identifier'
  name: string
}

export interface NumericLiteral extends BaseNode {
  type: 'NumericLiteral'
  value: number
}

export interface BooleanLiteral extends BaseNode {
  type: 'BooleanLiteral'
  value: boolean
}

export interface StringLiteral extends BaseNode {
  type: 'StringLiteral'
  value: string
}

export interface ObjectLiteral extends BaseNode {
  type: 'ObjectLiteral'
  properties: Property[]
}

export interface FunctionLiteral extends BaseNode {
  type: 'FunctionLiteral'
  params: ParameterDeclaration[]
  body: BlockStatement
  returnType: Identifier
}

export interface Property extends BaseNode {
  type: 'Property'
  key: Identifier
  value?: Expression
}

export interface NullLiteral extends BaseNode {
  type: 'NullLiteral'
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression'
  operator: Comparators | Operators | LogicalOperators
  left: Expression
  right: Expression
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression'
  callee: Expression
  arguments: Expression[]
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression'
  object: Expression
  property: Expression
  computed: boolean
}

export interface AssignmentExpression extends BaseNode {
  type: 'AssignmentExpression'
  operator: '='
  left: Identifier | MemberExpression // Solo variables, no se permite reasignar a constantes
  right: Expression
}

// Tipos unificados
export type Statement =
  | Program
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | BlockStatement
  | ExpressionStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement

export type Expression =
  | Identifier
  | NumericLiteral
  | BooleanLiteral
  | StringLiteral
  | ObjectLiteral
  | FunctionLiteral
  | NullLiteral
  | BinaryExpression
  | CallExpression
  | MemberExpression
  | AssignmentExpression
