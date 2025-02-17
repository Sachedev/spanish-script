import Parser from './frontend/parser/parser.ts'
import { setupGlobalScope } from './runtime/setup/setup-scope.ts'
import { evaluate } from './runtime/interpreter.ts'

const args = Deno.args

if (args.length === 0 || args.length > 1) {
  console.log('Utiliza: deno run --allow-read --allow-write main.ts <file>')
  Deno.exit(1)
}

const file = args[0]

try {
  try {
    const fileExists = await Deno.stat(file)

    if (!fileExists) {
      console.log(`El archivo ${file} no existe`)
      Deno.exit(1)
    }
    if (!fileExists.isFile) {
      console.log(`La ruta ${file} no es un archivo`)
      Deno.exit(1)
    }
  } catch (_e) {
    console.log(`No se pudo encontrar el archivo ${file}`)
    Deno.exit(1)
  }

  const fileUrl = import.meta.resolve(file)

  const source = await Deno.readTextFile(new URL(fileUrl))

  const env = setupGlobalScope()
  const parser = new Parser().parse(source, fileUrl)
  evaluate(parser, env)
} catch (e) {
  console.log(`Error reading file: ${e}`)
  Deno.exit(1)
}
