import { red, bold, gray, white } from '@std/fmt/colors'
import { Location } from '../frontend/lexer.ts'

export function previewLines(
  sourceCode: string,
  start: Location,
  end?: Location,
  len: number = 100
): string {
  const lines = sourceCode.split('\n')
  const errorLineIdx = start.line - 1 // Convertimos a índice 0

  // Determinamos qué líneas mostrar como contexto.
  // Si el error está en la primera línea mostramos esa y las dos siguientes.
  // En otro caso, mostramos la línea anterior, la línea del error y la siguiente (si existen).
  let contextStart: number, contextEnd: number
  if (errorLineIdx === 0) {
    contextStart = 0
    contextEnd = Math.min(lines.length - 1, 2)
  } else if (errorLineIdx === lines.length - 1) {
    contextEnd = lines.length - 1
    contextStart = Math.max(0, errorLineIdx - 2)
  } else {
    contextStart = errorLineIdx - 1
    contextEnd = Math.min(lines.length - 1, errorLineIdx + 1)
  }

  // Función auxiliar para truncar la línea si es demasiado larga.
  // Si se provee "errorCol", se intenta que la porción mostrada incluya esa posición.
  function truncateLine(
    line: string,
    errorCol?: number
  ): { text: string; offset: number } {
    if (line.length <= len) {
      return { text: line, offset: errorCol ? errorCol - 1 : 0 }
    }
    // Si la columna del error está dentro de los primeros "len" caracteres, se trunca al final.
    if (errorCol && errorCol - 1 < len) {
      return { text: line.slice(0, len) + '...', offset: errorCol - 1 }
    }
    // Caso contrario, centramos la porción mostrada en torno a la columna del error.
    let startIdx = errorCol ? errorCol - 1 - Math.floor(len / 2) : 0
    if (startIdx < 0) startIdx = 0
    if (startIdx + len > line.length) {
      startIdx = line.length - len
    }
    const truncated =
      (startIdx > 0 ? '...' : '') +
      line.slice(startIdx, startIdx + len) +
      (startIdx + len < line.length ? '...' : '')
    // Calculamos la posición de la columna del error en la línea truncada.
    const offset =
      (errorCol ? errorCol - 1 : 0) - startIdx + (startIdx > 0 ? 3 : 0)
    return { text: truncated, offset }
  }

  let result = ''
  // Calculamos el ancho necesario para mostrar los números de línea.
  const lineNumberWidth = (contextEnd + 1).toString().length

  for (let i = contextStart; i <= contextEnd; i++) {
    let lineText: string
    let markerOffset = 0
    if (i === errorLineIdx) {
      // Procesamos la línea del error para incluir la columna y que se trunque adecuadamente.
      const processed = truncateLine(lines[i], start.column)
      lineText = processed.text
      markerOffset = processed.offset
    } else {
      const processed = truncateLine(lines[i])
      lineText = processed.text
    }
    const lineNumStr = (i + 1).toString().padStart(lineNumberWidth, ' ')
    result += `${
      i === errorLineIdx ? red(bold('>')) : ' '
    } ${lineNumStr} | ${white(lineText)}\n`
    if (i === errorLineIdx) {
      // Agregamos la línea del marcador. Si se indicó "end" (y en la misma línea),
      // se marca la extensión del error con varios "^".
      const marker =
        ' '.repeat(markerOffset) +
        (end && end.line === start.line
          ? red(bold('^'.repeat(Math.max(1, end.column - start.column))))
          : red(bold('^')))
      result += ' '.repeat(lineNumberWidth) + '   | ' + marker + '\n'
    }
  }

  return gray(result)
}
