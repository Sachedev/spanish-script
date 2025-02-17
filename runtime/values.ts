import { Node } from '../frontend/ast.ts'
import Environment from './environment.ts'

export interface NumeroValue {
  type: 'numero'
  value: number
}

export interface TextoValue {
  type: 'texto'
  value: string
}

export interface BooleanValue {
  type: 'booleano'
  value: boolean
}

export interface ObjectValue {
  type: 'objeto'
  value: Map<string, Value>
}

export type NativeFunction = (args: Value[], env: Environment) => Value
export interface NativeFunctionValue {
  type: 'native_function'
  value: NativeFunction
}

export interface FunctionProperties {
  params: { name: string; type: ValuesType }[]
  declarationEnv: Environment
  body: Node[]
}
export interface FunctionValue {
  type: 'funcion'
  value: FunctionProperties
}

export interface NullValue {
  type: 'nulo'
  value: null
}

export type Value =
  | NumeroValue
  | TextoValue
  | BooleanValue
  | ObjectValue
  | NativeFunctionValue
  | FunctionValue
  | NullValue

export type ValuesType =
  | 'nulo'
  | 'booleano'
  | 'numero'
  | 'texto'
  | 'objeto'
  | 'native_function'
  | 'funcion'

export type ValueTypeToValue<T extends ValuesType> = T extends 'texto'
  ? TextoValue
  : T extends 'numero'
  ? NumeroValue
  : T extends 'booleano'
  ? BooleanValue
  : T extends 'nulo'
  ? NullValue
  : T extends 'objeto'
  ? ObjectValue
  : T extends 'native_function'
  ? NativeFunctionValue
  : T extends 'funcion'
  ? FunctionValue
  : never

export type ValueTypeToType<T extends ValuesType> = T extends 'texto'
  ? string
  : T extends 'numero'
  ? number
  : T extends 'booleano'
  ? boolean
  : T extends 'nulo'
  ? null
  : T extends 'objeto'
  ? ObjectValue
  : T extends 'native_function'
  ? NativeFunction
  : T extends 'funcion'
  ? FunctionValue
  : never
