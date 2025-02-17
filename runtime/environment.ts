import { error, ErrorType } from '../error/error_manager.ts'
import { BlockKind } from '../frontend/ast.ts'
import { Constant, Variable } from './environment/variables.ts'
import { Value, ValuesType } from './values.ts'

type EnvironmentKind = 'global' | BlockKind

export default class Environment {
  readonly parent?: Environment
  readonly variables: Map<string, Variable | Constant> = new Map()
  readonly kind: EnvironmentKind = 'global'

  returnValue?: Value

  values = {
    isReturn: false,
    isBreak: false,
    isContinue: false,
  }

  constructor(kind?: EnvironmentKind, parent?: Environment) {
    this.parent = parent
    this.kind = kind ?? 'global'
  }

  /**
   * # Use error.currentLoc to set the location of the error
   * Declares a variable in the current environment
   * @param name The name of the variable
   * @param value The value of the variable
   * @param typeAnnotation The type of the variable
   * @param isConstant Whether the variable is a constant
   * @returns Return the value of the variable
   * @example
   * const a = 10; // <-- variable declaration
   * const b = 10; // <-- variable declaration
   * var Number c = 10; // <-- variable declaration
   * var Texto d; // <-- variable declaration
   */
  declareVariable(
    name: string,
    value?: Value,
    typeAnnotation?: ValuesType,
    isConstant = false
  ): Value {
    if (this.variables.has(name)) {
      return error.printError(
        ErrorType.TypeError,
        `La variable ${name} ya ha sido declarada.`
      )
    }
    const type = typeAnnotation ?? value?.type

    if (type == null) {
      return error.printError(
        ErrorType.TypeError,
        `No se puede declarar la variable ${name} sin un tipo.`
      )
    }

    let variable: Variable | Constant
    if (isConstant) {
      if (value == null) {
        return error.printError(
          ErrorType.TypeError,
          `No se puede declarar la constante ${name} sin un valor.`
        )
      }
      variable = new Constant(name, type, value)
    } else {
      variable = new Variable(name, type, value)
    }
    this.variables.set(name, variable)

    return { type: 'nulo', value: null }
  }

  /**
   * # Use error.currentLoc to set the location of the error
   * Assigns a value to a variable in the current environment
   * @param name The name of the variable
   * @param value The value to assign
   * @returns Return the value of the variable
   * @example
   * a = 10; // <-- assign variable
   * b = "Hola"; // <-- assign variable
   */
  assignVariable(name: string, value: Value): Value {
    const env = this.resolveVariable(name)

    const variable = env.variables.get(name)!

    if (variable instanceof Constant) {
      return error.printError(
        ErrorType.TypeError,
        `No se puede reasignar la constante ${name}`
      )
    }

    variable.set(value)

    return value
  }

  /**
   * # Use error.currentLoc to set the location of the error
   * Looks up a variable in the current environment
   * @param name The name of the variable
   * @returns Return the value of the variable
   * @example
   * a; // <-- lookup variable
   */
  lookupVariable(name: string): Value {
    const env = this.resolveVariable(name)

    return env.variables.get(name)!.get()
  }

  /**
   * # Use error.currentLoc to set the location of the error
   * Resolves a variable in the current environment
   * @param name The name of the variable
   * @returns Return the environment where the variable is declared
   * @example
   * const hola = "Hola";
   *
   * si (verdadero) {
   *   imprimir(hola); // <-- resolve variable
   * }
   */
  resolveVariable(name: string): Environment {
    if (this.variables.has(name)) {
      return this
    }
    if (!this.parent) {
      return error.printError(
        ErrorType.ReferenceError,
        `No se puede resolver la variable ${name}`
      )
    }
    return this.parent.resolveVariable(name)
  }
}
