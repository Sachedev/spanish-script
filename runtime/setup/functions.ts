import { reset, green, yellow, gray, cyan, blue } from '@std/fmt/colors'
import Environment from '../environment.ts'
import {
  Value,
  ValuesType,
  TextoValue,
  NumeroValue,
  BooleanValue,
  NativeFunction,
} from '../values.ts'
import { error } from '../../error/error_manager.ts'

function verifyType(value: Value, type: ValuesType) {
  if (value.type !== type) {
    throw `Expected ${type} but found ${value.type}`
  }
  return value
}

type VerifyType<T extends 'texto' | 'numero' | 'booleano' | unknown> =
  T extends 'texto'
    ? TextoValue
    : T extends 'numero'
    ? NumeroValue
    : T extends 'booleano'
    ? BooleanValue
    : never

function limitArgs(args: Value[], min: number, max?: number) {
  if (args.length < min || (max != null ? args.length > max : false)) {
    throw `Expected ${
      max ? `between ${min} and ${max}` : min
    } arguments but found ${args.length}`
  }
  return args
}
function specifyArgs<const T extends [...args: unknown[]]>(
  args: Value[],
  types: T
): { [Index in keyof T]: VerifyType<T[Index]> } {
  const argsCounted = limitArgs(args, types.length)

  const funcArgs: Value[] = []

  for (let i = 0; i < argsCounted.length; i++) {
    funcArgs.push(verifyType(args[i], types[i] as ValuesType))
  }

  return funcArgs as { [Index in keyof T]: VerifyType<T[Index]> }
}
function declareNFunc<
  const T extends [...args: unknown[]] | undefined = undefined
>(
  env: Environment,
  name: string,
  func: (
    args: T extends undefined
      ? Value[]
      : { [Index in keyof T]: VerifyType<T[Index]> },
    env: Environment
  ) => Value | void,
  argumentTypes?: T
) {
  const fn = (
    argumentTypes
      ? (args: Value[], env: Environment) =>
          // deno-lint-ignore no-explicit-any
          func(specifyArgs(args, argumentTypes) as any, env)
      : func
  ) as NativeFunction
  error.currentLoc = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
  }
  env.declareVariable(
    name,
    {
      type: 'native_function',
      value: (args, env) => fn(args, env) ?? { type: 'nulo', value: null },
    },
    'native_function',
    true
  )
}

export function setupGlobalFunctions(env: Environment) {
  const showValue = (value: Value) => {
    const end = reset('')
    switch (value.type) {
      case 'nulo':
        return gray('nulo') + end
      case 'booleano':
        return blue(value.value ? 'verdadero' : 'falso') + end
      case 'numero':
        return yellow(value.value.toString()) + end
      case 'texto':
        return green(`"${value.value}"`) + end
      case 'objeto':
        return cyan('{...}') + end
      case 'native_function':
      case 'funcion':
        return cyan('funcion(...)') + end
      default:
        throw 'Error: Unknown type'
    }
  }
  declareNFunc(env, 'imprimir', (args, _env) => {
    console.log(...args.map(showValue))
  })

  declareNFunc(env, 'tipo_de', (args, _env) => {
    const value = limitArgs(args, 1)[0]

    switch (value.type) {
      case 'nulo':
        return { type: 'texto', value: 'Nulo' }
      case 'booleano':
        return { type: 'texto', value: 'Booleano' }
      case 'numero':
        return { type: 'texto', value: 'Numero' }
      case 'texto':
        return { type: 'texto', value: 'Texto' }
      case 'objeto':
        return { type: 'texto', value: 'Objeto' }
      case 'native_function':
      case 'funcion':
        return { type: 'texto', value: 'Funcion' }
      default:
        throw 'Error: Unknown type'
    }
  })

  declareNFunc(env, 'Numero', (args, _env) => {
    const value = limitArgs(args, 1)[0]
    const num = Number(value.value)
    if (Number.isNaN(num)) {
      throw 'Cannot convert to number'
    }
    return { type: 'numero', value: num }
  })
  declareNFunc(env, 'Texto', (args, _env) => {
    const value = limitArgs(args, 1)[0]
    return { type: 'texto', value: String(value.value) }
  })
  declareNFunc(env, 'Booleano', (args, _env) => {
    const value = limitArgs(args, 1)[0]
    return { type: 'booleano', value: Boolean(value.value) }
  })
}
