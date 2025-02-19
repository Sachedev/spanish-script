import { error, ErrorType } from '../../error/error_manager.ts'
import { Value, ValuesType } from '../values.ts'

class VariableBase {
  name: string
  type: ValuesType
  value?: Value
  constructor(name: string, type: ValuesType, value?: Value) {
    this.name = name
    this.type = type

    if (value) {
      if (value.type !== type) {
        error.printError(
          ErrorType.TypeError,
          `No se puede asignar un valor de diferente tipo. La variable o constante tiene el tipo ${type} pero se intenta asignar un valor de tipo ${value.type}.`
        )
      }
      this.value = value
    }
  }

  get() {
    return this.value
  }

  set(value: Value) {
    this.value = value as Value
  }
}

export class Constant extends VariableBase {
  declare value: Value
  constructor(name: string, type: ValuesType, value?: Value) {
    super(name, type, value)

    if (!value) {
      return error.printError(
        ErrorType.TypeError,
        `No se puede declarar una constante sin un valor.`
      )
    }
  }

  override get(): Value {
    return this.value
  }

  override set(_value: Value) {
    error.printError(
      ErrorType.TypeError,
      `No se puede asignar un valor a una constante.`
    )
  }
}

export class Variable extends VariableBase {
  constructor(name: string, type: ValuesType, value?: Value) {
    super(name, type, value)
  }

  override get(): Value {
    if (!this.value) {
      return error.printError(
        ErrorType.ReferenceError,
        `No se puede acceder a una variable no inicializada.`
      )
    }
    return this.value
  }

  override set(value: Value) {
    if (this.type !== value.type) {
      return error.printError(
        ErrorType.TypeError,
        `No se puede asignar un valor de diferente tipo. La variable tiene el tipo ${this.type} pero se intenta asignar un valor de tipo ${value.type}.`
      )
    }
    this.value = value as Value
  }
}
