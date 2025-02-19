import { error, ErrorType } from '../../error/error_manager.ts'
import {
  Program,
  Identifier,
  FunctionDeclaration,
  IfStatement,
  BlockStatement,
  ReturnStatement,
  Expression,
  WhileStatement,
  BreakStatement,
  ContinueStatement,
} from '../../frontend/ast.ts'
import Environment from '../environment.ts'
import { evaluate } from '../interpreter.ts'
import { Value, ValuesType } from '../values.ts'

export function evaluate_program(program: Program, env: Environment): Value {
  for (const statement of program.body) {
    evaluate(statement, env)
  }
  return { type: 'nulo', value: null }
}

export function evaluate_expression_statement(
  expression: Expression,
  env: Environment
): Value {
  return evaluate(expression, env)
}

export function evaluate_if_statement(
  ifStatement: IfStatement,
  env: Environment
): Value {
  const condition = evaluate(ifStatement.condition, env)

  if (condition.type !== 'booleano') {
    return error.printError(
      ErrorType.TypeError,
      'Solo se pueden usar valores booleanos como condiciones.',
      ifStatement.condition.start,
      ifStatement.condition.end
    )
  }

  if (condition.value) {
    return evaluate(ifStatement.consequent, env)
  } else if (ifStatement.alternate) {
    return evaluate(ifStatement.alternate, env)
  } else {
    return { type: 'nulo', value: null }
  }
}

export function evaluate_return_statement(
  returnStatement: ReturnStatement,
  env: Environment
): Value {
  let funcEnv: Environment = env

  while (funcEnv.kind !== 'function_block') {
    funcEnv = funcEnv.parent!
    if (!funcEnv) {
      return error.printError(
        ErrorType.TypeError,
        'No se puede usar `devolver` fuera de una función.',
        returnStatement.start,
        returnStatement.end
      )
    }
    // If the function is a block, we can return from it
    if (funcEnv.kind === 'function_block') {
      break
    }
  }

  const returnValue = evaluate(returnStatement.argument, env)
  funcEnv.values.isReturn = true
  funcEnv.returnValue = returnValue

  return { type: 'nulo', value: null }
}

export function evaluate_block_statement(
  blockStatement: BlockStatement,
  env: Environment
): Value {
  const newEnv = new Environment(blockStatement.kind, env)

  for (const statement of blockStatement.body) {
    evaluate(statement, newEnv)
  }
  return { type: 'nulo', value: null }
}

export function typeToValuesType(type: string): ValuesType {
  switch (type) {
    case 'Nulo':
      return 'nulo'
    case 'Booleano':
      return 'booleano'
    case 'Numero':
      return 'numero'
    case 'Texto':
      return 'texto'
    case 'Objeto':
      return 'objeto'
    case 'Funcion':
      return 'funcion'
    default:
      return error.printError(
        ErrorType.InternalError,
        `Tipo desconocido: ${type}`
      )
  }
}
export function evaluate_function_declaration(
  declaration: FunctionDeclaration,
  env: Environment
): Value {
  error.currentLoc = { start: declaration.start, end: declaration.end }
  const func: Value = {
    type: 'funcion',
    value: {
      params: declaration.params.map((param) => {
        error.currentLoc = { start: param.start, end: param.end }
        return {
          name: param.identifier.name,
          type: typeToValuesType(param.typeAnnotation.name),
        }
      }),
      declarationEnv: env,
      body: declaration.body.body,
      returnType: typeToValuesType(declaration.returnType.name),
    },
  }

  error.currentLoc = { start: declaration.start, end: declaration.end }
  env.declareVariable(declaration.id.name, func, 'funcion', true)

  return { type: 'nulo', value: null }
}

export function evaluate_variable_declaration(
  kind: 'var' | 'const',
  identifier: Identifier,
  typeAnnotation: Identifier | undefined,
  value: Expression | undefined,
  env: Environment
): Value {
  const val = value && evaluate(value, env)

  const type = typeAnnotation?.name
    ? typeToValuesType(typeAnnotation.name)
    : val?.type

  if (type == null) {
    return error.printError(
      ErrorType.TypeError,
      `No se pudo encontrar o inferir el tipo de la variable ${identifier.name}.`
    )
  }

  error.currentLoc = { start: identifier.start, end: identifier.end }
  env.declareVariable(identifier.name, val, type, kind === 'const')

  return { type: 'nulo', value: null }
}

export function evaluate_while_statement(
  whileStatement: WhileStatement,
  env: Environment
): Value {
  while (true) {
    const newEnv = new Environment('while_block', env)
    const condition = evaluate(whileStatement.condition, env)

    if (condition.type !== 'booleano') {
      return error.printError(
        ErrorType.TypeError,
        'Solo se pueden usar valores booleanos como condiciones.',
        whileStatement.condition.start,
        whileStatement.condition.end
      )
    }

    if (!condition.value) {
      return { type: 'nulo', value: null }
    }

    for (const statement of whileStatement.body.body) {
      evaluate(statement, newEnv)
      if (newEnv.values.isBreak) {
        newEnv.values.isBreak = false
        return { type: 'nulo', value: null }
      }
      if (newEnv.values.isContinue) {
        newEnv.values.isContinue = false
        break
      }
    }
  }
}

export function evaluate_break_statement(
  ast: BreakStatement,
  env: Environment
): Value {
  let loopEnv: Environment = env

  while (loopEnv.kind !== 'while_block') {
    loopEnv = loopEnv.parent!
    if (!loopEnv) {
      return error.printError(
        ErrorType.TypeError,
        'No se puede usar `romper` fuera de una sentencia mientras.',
        ast.start,
        ast.end
      )
    }
  }

  loopEnv.values.isBreak = true

  return { type: 'nulo', value: null }
}

export function evaluate_continue_statement(
  ast: ContinueStatement,
  env: Environment
): Value {
  let loopEnv: Environment = env

  while (loopEnv.kind !== 'while_block') {
    loopEnv = loopEnv.parent!
    if (!loopEnv) {
      return error.printError(
        ErrorType.TypeError,
        'No se puede usar `continuar` fuera de una sentencia mientras.',
        ast.start,
        ast.end
      )
    }
  }

  loopEnv.values.isContinue = true

  return { type: 'nulo', value: null }
}
