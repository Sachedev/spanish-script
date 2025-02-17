import { bold } from '@std/fmt/colors'
import { previewLines } from './preview.ts'
import { Location } from '../frontend/lexer.ts'

export enum ErrorType {
  SyntaxError = 'Error de sintaxis', // Error de sintaxis, sucede cuando se parsea un token que no es válido
  ReferenceError = 'Error de referencia', // Error de referencia, sucede cuando se intenta acceder a una variable que no existe
  TypeError = 'Error de tipo', // Error de tipo, sucede cuando se intenta realizar una operación con un valor de tipo incorrecto, ejemplo: sumar "hola" a 1
  InternalError = 'Error interno', // Error interno, sucede cuando se produce un error interno en el sistema
}

class ErrorManager {
  currentFile?: string
  currentLoc: { start: Location; end: Location } | undefined

  printError(
    type: ErrorType,
    message: string,
    startLoc?: Location,
    endLoc?: Location
  ): never {
    const start = startLoc ?? this.currentLoc?.start
    const end = endLoc ?? this.currentLoc?.end
    const sourceCode =
      this.currentFile && Deno.readTextFileSync(new URL(this.currentFile))
    const errorMessage = `
${this.currentFile ? `Archivo: ${this.currentFile}` : 'General'}
${
  start
    ? `
${bold(`Línea ${start.line}:${start.column}`)}:  ${type}: ${message}

${sourceCode ? previewLines(sourceCode, start, end) : ''}
`
    : 'Ubicación desconocida'
}
`

    console.error(errorMessage)
    Deno.exit(1)
  }

  setCurrentFile(file: string | undefined) {
    this.currentFile = file
  }
}

export const error = new ErrorManager()
