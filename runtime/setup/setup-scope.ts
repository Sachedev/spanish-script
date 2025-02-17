import Environment from '../environment.ts'
import { setupGlobalFunctions } from './functions.ts'
import { setupGlobalValues } from './variables.ts'

export function setupGlobalScope() {
  const env = new Environment('global')

  // Define native values
  setupGlobalValues(env)

  // Define native functions
  setupGlobalFunctions(env)
  return env
}
