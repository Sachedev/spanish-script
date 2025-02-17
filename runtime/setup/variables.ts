import { error } from '../../error/error_manager.ts'
import Environment from '../environment.ts'
import { Value } from '../values.ts'

function declare(env: Environment, name: string, value: Value) {
  error.currentLoc = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
  }
  env.declareVariable(name, value, value.type, true)
}

const MK = {
  nulo(): Value {
    return { type: 'nulo', value: null }
  },
  booleano(value: boolean): Value {
    return { type: 'booleano', value }
  },
  numero(value: number): Value {
    return { type: 'numero', value }
  },
  texto(value: string): Value {
    return { type: 'texto', value }
  },
}

export function setupGlobalValues(env: Environment) {
  declare(env, 'nulo', MK.nulo())
  declare(env, 'verdadero', MK.booleano(true))
  declare(env, 'falso', MK.booleano(false))
}
