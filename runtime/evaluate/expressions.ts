import { error, ErrorType } from '../../error/error_manager.ts'
import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Expression,
  FunctionLiteral,
  MemberExpression,
  Node,
  ObjectLiteral,
} from '../../frontend/ast.ts'
import {
  Comparators,
  LogicalOperators,
  Operators,
} from '../../frontend/lexer.ts'
import Environment from '../environment.ts'
import { evaluate } from '../interpreter.ts'
import { Value, NumeroValue, ObjectValue, FunctionValue } from '../values.ts'
import { typeToValuesType } from './statements.ts'

export function evaluate_object_literal(
  ast: ObjectLiteral,
  env: Environment
): Value {
  error.currentLoc = { start: ast.start, end: ast.end }
  const value = new Map(
    ast.properties.map(({ key, value }) => [
      key.name,
      value ? evaluate(value, env) : env.lookupVariable(key.name),
    ])
  )

  return { type: 'objeto', value }
}

export function evaluate_function_literal(
  ast: FunctionLiteral,
  env: Environment
): Value {
  const funcValue: FunctionValue = {
    type: 'funcion',
    value: {
      body: ast.body.body,
      params: ast.params.map((param) => {
        error.currentLoc = { start: param.start, end: param.end }
        return {
          name: param.identifier.name,
          type: typeToValuesType(param.typeAnnotation.name),
        }
      }),
      declarationEnv: env,
    },
  }
  return funcValue
}

export function evaluate_member_expression(
  ast: MemberExpression,
  env: Environment
): Value {
  const ref = getReference(ast, env)
  const value = ref.base.value.get(ref.key)
  if (!value) {
    return error.printError(
      ErrorType.ReferenceError,
      `No se puede acceder a dicha propiedad del objeto.`,
      ast.property.start,
      ast.property.end
    )
  }
  return value
}

function _evaluate_function_block(body: Node[], env: Environment): Value {
  for (const statement of body) {
    evaluate(statement, env)
    if (env.returnValue) {
      return env.returnValue
    }
  }
  return { type: 'nulo', value: null }
}
export function evaluate_call_expression(
  ast: CallExpression,
  env: Environment
): Value {
  const { callee, arguments: args } = ast

  const func = evaluate(callee, env)

  if (func.type === 'native_function') {
    return func.value(
      args.map((arg) => evaluate(arg, env)),
      env
    )
  } else if (func.type === 'funcion') {
    const funcValue = func.value
    const declarationEnv = funcValue.declarationEnv
    const body = funcValue.body

    const newEnv = new Environment('function_block', declarationEnv)

    if (args.length !== funcValue.params.length) {
      return error.printError(
        ErrorType.TypeError,
        `Se esperaba ${funcValue.params.length} argumentos pero se encontraron ${args.length}`,
        ast.start,
        ast.end
      )
    }

    for (let i = 0; i < funcValue.params.length; i++) {
      const param = funcValue.params[i]
      const value = evaluate(args[i], env)

      if (value.type !== param.type) {
        return error.printError(
          ErrorType.TypeError,
          `Se esperaba un ${param.type} pero se encontró ${value.type}`,
          args[i].start,
          args[i].end
        )
      }

      error.currentLoc = { start: args[i].start, end: args[i].end }
      newEnv.declareVariable(
        param.name,
        evaluate(args[i], env),
        value.type,
        true
      )
    }

    return _evaluate_function_block(body, newEnv)
  }

  return error.printError(
    ErrorType.TypeError,
    `No se puede llamar a algo que no sea una función`,
    ast.start,
    ast.end
  )
}

export function evaluate_assignment_expression(
  ast: AssignmentExpression,
  env: Environment
): Value {
  const right = evaluate(ast.right, env)
  const left = ast.left
  const { start, end } = left

  if (left.type === 'Identifier') {
    error.currentLoc = { start, end }
    env.assignVariable(left.name, right)
    return right
  } else if (left.type === 'MemberExpression') {
    const ref = getReference(left, env)

    ref.base.value.set(ref.key, right)
    return right
  }

  return error.printError(
    ErrorType.SyntaxError,
    'Asignación inválida. Se esperaba una variable o una propiedad.',
    start,
    end
  )
}

/**
 * Obtiene la referencia de la propiedad a la que se asignará el valor.
 * Para un MemberExpression, evalúa el objeto base y obtiene la clave
 * (ya sea mediante notación de punto o corchetes).
 *
 * Devuelve un objeto con:
 *  - base: el ObjectValue sobre el que se asigna
 *  - key: la propiedad (como string)
 *
 * En caso de error, se imprime el mensaje correspondiente y se devuelve null.
 */
function getReference(
  expr: Expression,
  env: Environment,
  base?: ObjectValue
): { base: ObjectValue; key: string } {
  if (expr.type !== 'MemberExpression') {
    return error.printError(
      ErrorType.SyntaxError,
      'La asignación solo puede realizarse a una variable o a una propiedad',
      expr.start,
      expr.end
    )
  }

  // Evaluamos la parte izquierda (el objeto sobre el que se asignará).
  let baseValue: Value
  if (!base) {
    baseValue = evaluate(expr.object, env)
  } else {
    baseValue = base
  }

  if (baseValue.type !== 'objeto') {
    return error.printError(
      ErrorType.TypeError,
      'No se puede asignar un valor a una propiedad de un no objeto',
      expr.object.start,
      expr.object.end
    )
  }

  let key: string
  if (expr.computed) {
    const keyObj =
      expr.property.type === 'MemberExpression'
        ? expr.property.object
        : expr.property
    // Notación con corchetes: se evalúa la expresión que define la propiedad.
    const keyValue = evaluate(keyObj, env)
    if (keyValue.type !== 'texto') {
      return error.printError(
        ErrorType.TypeError,
        'La propiedad debe ser de tipo texto',
        keyObj.start,
        keyObj.end
      )
    }
    key = keyValue.value
  } else {
    const keyObj =
      expr.property.type === 'MemberExpression'
        ? expr.property.object
        : expr.property

    // Notación de punto: se espera un identificador.
    if (keyObj.type !== 'Identifier') {
      return error.printError(
        ErrorType.TypeError,
        'Se esperaba un identificador en la propiedad',
        keyObj.start,
        keyObj.end
      )
    }
    key = keyObj.name
  }

  if (expr.property.type === 'MemberExpression') {
    return getReference(
      expr.property,
      env,
      getBaseOfReference(expr, baseValue, key)
    )
  }

  return { base: baseValue, key }
}

function getBaseOfReference(
  expr: MemberExpression,
  base: ObjectValue,
  key: string
) {
  const baseValue = base.value.get(key)
  if (!baseValue) {
    return error.printError(
      ErrorType.ReferenceError,
      `No se puede acceder a la propiedad ${key}`,
      expr.property.start,
      expr.property.end
    )
  }
  if (baseValue.type !== 'objeto') {
    return error.printError(
      ErrorType.TypeError,
      `La propiedad ${key} no es un objeto`,
      expr.property.start,
      expr.property.end
    )
  }
  return baseValue
}

const NUMERIC_OPERATORS_AND_COMPARATORS: Set<
  Operators | Comparators | LogicalOperators
> = new Set(['+', '-', '*', '/', '%', '^', '>', '>=', '<', '<='])
export function evaluate_binary_expression(
  ast: BinaryExpression,
  env: Environment
): Value {
  const left = evaluate(ast.left, env)
  const right = evaluate(ast.right, env)
  const { operator } = ast

  if (
    left.type === 'numero' &&
    right.type === 'numero' &&
    NUMERIC_OPERATORS_AND_COMPARATORS.has(operator)
  ) {
    return _evaluate_numeric_binary_expression(left, right, ast, operator)
  }

  switch (operator) {
    case '==':
      return { type: 'booleano', value: left.value === right.value }
    case '!=':
      return { type: 'booleano', value: left.value !== right.value }
    case 'y':
      if (left.type !== 'booleano' || right.type !== 'booleano') {
        return error.printError(
          ErrorType.TypeError,
          'Para usar el operador "y" se esperaban dos valores booleanos.',
          ast.left.start,
          ast.right.end
        )
      }
      return { type: 'booleano', value: left.value && right.value }
    case 'o':
      if (left.type !== 'booleano' || right.type !== 'booleano') {
        return error.printError(
          ErrorType.TypeError,
          'Para usar el operador "o" se esperaban dos valores booleanos.',
          ast.left.start,
          ast.right.end
        )
      }
      return { type: 'booleano', value: left.value || right.value }
    case '+':
      if (left.type === 'texto' && right.type === 'texto') {
        return { type: 'texto', value: left.value + right.value }
      }
      return error.printError(
        ErrorType.TypeError,
        'Para usar el operador "+" se esperaban dos valores numéricos o textos.',
        ast.left.start,
        ast.right.end
      )
    case '-':
    case '*':
    case '/':
    case '%':
    case '^':
      return error.printError(
        ErrorType.TypeError,
        `Para usar el operador "${operator}" se esperaban dos valores numéricos.`,
        ast.left.start,
        ast.right.end
      )
    default:
      return error.printError(
        ErrorType.InternalError,
        `Función aún no implementada con el operador ${operator}.`,
        ast.left.start,
        ast.right.end
      )
  }
}

export function _evaluate_numeric_binary_expression(
  left: NumeroValue,
  right: NumeroValue,
  ast: BinaryExpression,
  operator: Operators | Comparators | LogicalOperators
): Value {
  switch (operator) {
    case '>':
      return { type: 'booleano', value: left.value > right.value }
    case '>=':
      return { type: 'booleano', value: left.value >= right.value }
    case '<':
      return { type: 'booleano', value: left.value < right.value }
    case '<=':
      return { type: 'booleano', value: left.value <= right.value }
    case '+':
      return { type: 'numero', value: left.value + right.value }
    case '-':
      return { type: 'numero', value: left.value - right.value }
    case '*':
      return { type: 'numero', value: left.value * right.value }
    case '/':
      return { type: 'numero', value: left.value / right.value }
    case '%':
      return { type: 'numero', value: left.value % right.value }
    case '^':
      return { type: 'numero', value: left.value ** right.value }
    default:
      return error.printError(
        ErrorType.InternalError,
        `Función aún no implementada con el operador ${operator}.`,
        ast.left.start,
        ast.right.end
      )
  }
}
