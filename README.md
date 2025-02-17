# SpanishScript

SpanishScript es un lenguaje de programación de scripting muy simple y básico, este permite la creación de scripts muy sencillos. No está pensado para el uso en producción, pero sí para la creación de scripts de demostración.
Uno de los principales objetivos es su uso educativo en el curso de programación en español. La gran mayoría de lenguajes de programación esten hechos en inglés, por lo que puede ser difícil de entender para aquellos que no están familiarizados con el idioma.

## Objetivos

- Permitir la creación de scripts sencillos
- Ser muy sencillo de entender
- Ser facil de usar
- Uso educativo

## Sintaxis

### Variables

Existen las variables, cuyo valor puede ser cambiado a lo largo del script, y las constantes, que no pueden ser cambiadas.

```es
const a = 10; // constante
var b = 20; // variable
var Numero c; // variable sin valor inicial
```

### Operadores

Existen los siguientes operadores:

- `+`: Suma
- `-`: Resta
- `*`: Multiplicación
- `/`: División
- `%`: Resto de la división
- `++`: Incrementar
- `--`: Decrementar
- `==`: Igualdad
- `!=`: No igualdad
- `<`: Menor que
- `>`: Mayor que
- `<=`: Menor o igual que
- `>=`: Mayor o igual que

### Funciones

Las funciones son bloques de código que pueden ser llamadas en el script. Las funciones pueden recibir parámetros y devolver un valor.

```es
fun suma(Numero a, Numero b) {
  devolver a + b;
}
```

### Condicionales

Existen los siguientes tipos de condicionales:

- `si`: Inicia la estructura condicional
- `pero_si`: Continua la estructura condicional
- `sino`: Termina la estructura condicional

```es
si (numero == 10) {
  devolver "Es igual a 10";
} pero_si (numero > 10) {
  devolver "Es mayor que 10";
} sino {
  devolver "Es menor que 10";
}
```

### Bucles

Existen los siguientes tipos de bucles:

- `mientras`: Bucle infinito.
- `romper`: Si se encuentra dentro de un bucle, se detiene.
- `continuar`: Si se encuentra dentro de un bucle, pasa a la siguiente iteración.

```es
mientras (numero < 10) hacer {
  numero = numero + 1;

  si (numero == 5) {
    romper;
  } pero_si (numero == 3) {
    continuar;
  }

  imprimir(numero); // 1, 2, 4
}
```

### Funciones Nativas

Las funciones nativas son funciones que vienen incorporadas en el lenguaje. Estas funciones son llamadas directamente en el código y no se pueden definir en el script.

#### Imprimir

Sirve para imprimir en la consola el valor de una variable o una expresión.

```es
imprimir(numero); // Imprime el valor de numero
imprimir(a + b); // Imprime el valor de a + b
```

#### tipo_de

Sirve para obtener el tipo de una variable o una expresión. Devuelve un string con el tipo de la variable o expresión.

```es
tipo_de(10); // Devuelve "Numero"
tipo_de("Hola"); // Devuelve "Texto"
tipo_de(verdadero); // Devuelve "Booleano"
```

#### Conversoras de Tipo

Convierten un valor de un tipo a otro.

```es
Numero("10"); // 10
Texto(10); // "10"
Booleano(10); // verdadero
```

### Tipos de Datos

#### Numero

Son números enteros o decimales positivos o negativos.

#### Texto

Son cadenas de texto.

#### Booleano

Son valores booleanos, verdadero o falso.

### Objetos

Los objetos son colecciones de datos que pueden ser utilizados para almacenar y manipular información. Los objetos pueden tener propiedades y métodos.

#### Funciones

Son bloques de código que pueden ser llamados en el script. Las funciones pueden recibir parámetros y devolver un valor.

## Ejecución

Para ejecutar el script, se debe instalar [Deno](https://deno.land/).

Luego, se puede ejecutar el script con el siguiente comando:

```bash
deno run --allow-read --allow-write main.ts <archivo>
```

Donde `<archivo>` es el nombre del archivo que se desea ejecutar.

Por ejemplo, si se desea ejecutar el archivo `ejemplo.es`, se puede ejecutar el siguiente comando:

```bash
deno run --allow-read --allow-write main.ts ejemplo.es
```

## Contribuciones

Si desea contribuir al proyecto, puede hacerlo de varias maneras:

- Reportando errores o sugerencias de mejoras.
- Agregando nuevas funciones o características.
- Contribuyendo al código fuente.

## Licencia

Este proyecto está licenciado bajo la licencia MIT. Puedes ver el archivo [LICENSE](LICENSE) para más detalles.
