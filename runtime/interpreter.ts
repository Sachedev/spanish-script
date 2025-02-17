import { error, ErrorType } from '../error/error_manager.ts'
import { Node } from '../frontend/ast.ts'
import Environment from './environment.ts'
import {
  evaluate_object_literal,
  evaluate_call_expression,
  evaluate_binary_expression,
  evaluate_assignment_expression,
  evaluate_member_expression,
  evaluate_function_literal,
} from './evaluate/expressions.ts'
import {
  evaluate_function_declaration,
  evaluate_variable_declaration,
  evaluate_program,
  evaluate_if_statement,
  evaluate_while_statement,
  evaluate_block_statement,
  evaluate_return_statement,
  evaluate_expression_statement,
  evaluate_break_statement,
  evaluate_continue_statement,
} from './evaluate/statements.ts'
import { Value } from './values.ts'

export function evaluate(ast: Node, env: Environment): Value {
  switch (ast.type) {
    case 'NumericLiteral':
      return { type: 'numero', value: ast.value }
    case 'BooleanLiteral':
      return { type: 'booleano', value: ast.value }
    case 'StringLiteral':
      return { type: 'texto', value: ast.value }
    case 'ObjectLiteral':
      return evaluate_object_literal(ast, env)
    case 'IfStatement':
      return evaluate_if_statement(ast, env)
    case 'WhileStatement':
      return evaluate_while_statement(ast, env)
    case 'BreakStatement':
      return evaluate_break_statement(ast, env)
    case 'ContinueStatement':
      return evaluate_continue_statement(ast, env)
    case 'BlockStatement':
      return evaluate_block_statement(ast, env)
    case 'FunctionDeclaration':
      return evaluate_function_declaration(ast, env)
    case 'ReturnStatement':
      return evaluate_return_statement(ast, env)
    case 'Identifier':
      error.currentLoc = { start: ast.start, end: ast.end }
      return env.lookupVariable(ast.name)
    case 'MemberExpression':
      return evaluate_member_expression(ast, env)
    case 'CallExpression':
      return evaluate_call_expression(ast, env)
    case 'NullLiteral':
      return { type: 'nulo', value: null }
    case 'BinaryExpression':
      return evaluate_binary_expression(ast, env)
    case 'VariableDeclaration':
      return evaluate_variable_declaration(
        ast.kind,
        ast.identifier,
        ast.typeAnnotation,
        ast.value,
        env
      )
    case 'AssignmentExpression':
      return evaluate_assignment_expression(ast, env)
    case 'ExpressionStatement':
      return evaluate_expression_statement(ast.expression, env)
    case 'FunctionLiteral':
      return evaluate_function_literal(ast, env)
    case 'Program':
      return evaluate_program(ast, env)
    default:
      return error.printError(
        ErrorType.InternalError,
        `Tipo de nodo no implementado: ${JSON.stringify(ast)}`
      )
  }
}
