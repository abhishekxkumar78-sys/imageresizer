---
title: "Cómo cambiar el tamaño de una imagen a 100 KB online sin subirla"
slug: "como-cambiar-tamano-imagen-a-100-kb"
groupId: "how-to-resize-image-to-100-kb"
date: "2026-10-15"
author: "Equipo de ImageResizer"
category: "Guías"
metaTitle: "Cómo cambiar el tamaño de una imagen a 100 KB online (sin subir archivos)"
metaDescription: "Aprende a reducir el tamaño de tus fotos a 100 KB directamente en tu navegador. Guía paso a paso usando JPG sin subir datos a servidores externos."
readingTime: "4"
---

Para cambiar el tamaño de una imagen a 100 KB, abre [Redimensionar imagen](https://www.freeeimageresizer.com/es/), elige JPG como Formato en Salida, escribe 100 en la casilla Target file size (optional), selecciona KB y haz clic en Procesar imagen. La herramienta reduce la calidad y, si hace falta, las dimensiones en píxeles hasta acercar el archivo a los 100 KB. Nuestra herramienta no sube tus imágenes a ningún servidor.

Muchos formularios de solicitud, portales de empleo y plataformas académicas exigen adjuntar fotografías con un límite estricto de peso, con frecuencia de 100 KB. Si el archivo supera ese límite, el sistema rechaza el envío. Las cámaras de los teléfonos móviles actuales generan imágenes de varios megabytes de peso. Reducir esos archivos a una fracción de su tamaño inicial es un proceso sencillo cuando se conocen los pasos adecuados.

## Por qué los formularios imponen un límite de 100 KB

Los portales de trámites suelen establecer límites de peso para mantener bajo control el almacenamiento de sus bases de datos y los tiempos de carga de sus páginas. Lo más probable es que los administradores busquen agilizar la revisión de los documentos sin sobrecargar sus recursos informáticos. Dado que estos sistemas comprueban el peso final del archivo en bytes, tu objetivo principal es alcanzar los 100 KB manteniendo la debida claridad en rostros, firmas y textos.

## Pasos para reducir una imagen a 100 KB

Sigue estos pasos en nuestra herramienta gratuita de Redimensionar imagen:

1. Abre la página de Redimensionar imagen y haz clic en Seleccionar imágenes, o arrastra tu archivo directamente a la caja.
2. En Salida, selecciona JPG en Formato. Muchos portales piden JPG, así que sigue las instrucciones de tu portal, porque los sistemas de carga más antiguos pueden rechazar WebP. Si prefieres cambiar el formato antes, usa nuestro [Convertidor de imágenes](https://www.freeeimageresizer.com/es/convert).
3. En la sección de ajustes de exportación, busca el campo Target file size (optional). Escribe 100 y asegúrate de mantener la unidad en KB.
4. Haz clic en el botón Procesar imagen. La herramienta calculará los ajustes necesarios para aproximarse a tu objetivo.
5. Comprueba el tamaño final obtenido junto a la vista previa y haz clic en el botón Descargar para guardar la foto en tu dispositivo.


## Qué medimos

En una prueba real en este sitio procesamos una fotografía JPG de 4000×3000 píxeles de 1.453.802 bytes con salida JPG y Target file size (optional) en KB. La herramienta trata 1 KB como 1.024 bytes (igual que las propiedades de archivo en Windows), por lo que 200 KB significan 204.800 bytes y 100 KB equivalen a 102.400 bytes:

- Objetivo de 20 KB: 19.152 bytes (18,7 KB), con la imagen reducida también a 1216×912 píxeles
- Objetivo de 50 KB: 52.862 bytes (51,6 KB), con la imagen reducida también a 2662×1996 píxeles
- Objetivo de 100 KB: 100.609 bytes (98,3 KB)
- Objetivo de 200 KB: 204.074 bytes (199,3 KB)

En 20 KB y 50 KB, bajar la calidad JPG no bastó para comprimir tanto una foto de 4000×3000, así que la herramienta también redujo las dimensiones a 1216×912 y 2662×1996 píxeles.

En todas nuestras pruebas con fotos JPG y WebP el resultado osciló entre un 12% por debajo y un 6,8% por encima del objetivo, así que si tu formulario tiene un máximo estricto, escribe un número ligeramente menor que el límite y comprueba el tamaño final en las propiedades del archivo.

Al probar la misma fotografía con salida PNG y un objetivo de 100 KB, terminó en 194.225 bytes (189,7 KB) con la imagen reducida a 392×294 píxeles, porque PNG no puede bajar la calidad y solo cambia el tamaño en píxeles, así que elige JPG para envíos ligeros.
## Comprueba si existe un requisito de tamaño mínimo

Algunos formularios no solo indican un límite máximo, sino un rango completo, por ejemplo entre 20 KB y 100 KB. Si un archivo queda excesivamente reducido, la plataforma receptora podría no aceptarlo. Tras procesar tu imagen, revisa la cifra exacta en kilobytes que aparece junto a la previsualización para cerciorarte de que encaja dentro del rango exigido por tu trámite. Las imágenes que ya son pequeñas no se pueden ampliar para alcanzar un objetivo mayor. Si tu formulario exige un límite más estricto de 50 KB, lee nuestra guía para [reducir el tamaño de una imagen a 50 KB](https://www.freeeimageresizer.com/es/blog/reducir-tamano-imagen-a-50-kb).

## Cómo funciona el ajuste de tamaño en el código

Cuando escribes 100 en el campo de objetivo con la unidad KB seleccionada, el script calcula una meta exacta de 102.400 bytes. Lo que ocurre después depende del formato que hayas marcado.

En formatos con compresión con pérdida como JPG y WebP, el algoritmo realiza varias pruebas sucesivas ajustando los niveles de calidad para acercarse a la cifra deseada. Si la imagen todavía supera el límite fijado, el sistema reduce progresivamente las dimensiones del lienzo en píxeles hasta acercarse al objetivo de 100 KB. En la versión en inglés de nuestro [Compresor de imágenes](https://www.freeeimageresizer.com/compress) también puedes comprimir un archivo PDF con este mismo campo de tamaño deseado; los archivos PDF actualmente solo funcionan en esa página en inglés y se convierten página por página en imágenes, por lo que resulta más adecuada para documentos escaneados o con muchas imágenes.

Con el formato PNG ocurre algo distinto. Los navegadores web no admiten ajuste de calidad en archivos PNG porque es un formato estrictamente sin pérdida. Si eliges PNG con un objetivo de 100 KB, el programa no puede variar la compresión del color; únicamente puede reducir el peso encogiendo el ancho y el alto en píxeles. Por esta razón, elegir JPG proporciona resultados visuales notablemente mejores al buscar un límite de 100 KB para una foto de carnet o formulario.

Si una fotografía contiene texturas muy densas, es posible que el archivo resultante no quede exactamente en 100,0 KB. En ese caso, la herramienta selecciona la versión cuya diferencia matemática con respecto a los bytes pedidos sea la menor y te permite descargarla sin bloqueos.

## Qué hacer si la imagen se ve demasiado suave

Reducir una fotografía de alta resolución a solo 100 KB implica prescindir de parte de la información digital original. Las texturas finas perderán nitidez de forma inevitable. Si el resultado final carece de definición, prueba estos dos ajustes prácticos:

Recorta los bordes innecesarios antes de cambiar el tamaño. Si estás preparando una foto de carnet o un comprobante, utiliza primero nuestra herramienta de [Recortar imagen](https://www.freeeimageresizer.com/es/crop), guarda el archivo recortado y ábrelo en Redimensionar imagen. Al eliminar márgenes vacíos y fondos sobrantes, el compresor trabaja con menos píxeles y puede dedicar más datos a los elementos importantes de la imagen.

Reduce las dimensiones en píxeles de forma manual. Si conservas una anchura original de miles de píxeles, la compresión debe ser muy drástica para alcanzar 100 KB. Si primero bajas las dimensiones a un valor razonable, como 1000 píxeles de ancho, la imagen podrá guardarse con un ajuste de calidad superior.

## Procesamiento en tu propio navegador

Los archivos se procesan en la memoria local mediante la tecnología estándar de lienzo del navegador. Ninguna imagen se envía a bases de datos externas ni se almacena en máquinas remotas. Si deseas conocer a fondo cómo funcionan todas las utilidades de este sitio, consulta nuestra [guía de bienvenida](https://www.freeeimageresizer.com/es/blog/bienvenidos-a-freeeimageresizer).

## Preguntas frecuentes

### ¿Cómo cambio el tamaño de una imagen a 100 KB?

Abre Redimensionar imagen en tu navegador y carga la foto con Seleccionar imágenes. En Salida, elige JPG en Formato. Escribe 100 en Target file size (optional), mantén el selector en KB y haz clic en Procesar imagen. Revisa el tamaño junto a la vista previa y pulsa Descargar.

### ¿Por qué mi archivo quedó un poco por encima o por debajo de 100 KB?

El peso objetivo es aproximado porque la herramienta combina pasos de calidad JPG y escalado de píxeles en lugar de recortar bytes al azar. En nuestras pruebas con JPG y WebP, los resultados quedaron entre un 12% por debajo y un 6,8% por encima del objetivo, y 1 KB equivale a 1.024 bytes como en Windows.

### ¿Qué formato conviene elegir para subir a un formulario?

Elige JPG en la mayoría de los casos. Muchos portales piden JPG, así que sigue las instrucciones de tu portal, porque los sistemas de carga más antiguos pueden rechazar WebP. Como PNG no permite reducir la calidad de compresión en el navegador y solo baja el peso encogiendo los píxeles, JPG conserva mejor rostros y firmas cerca de 100 KB.

### ¿Se sube mi foto a algún servidor?

No, nuestra herramienta no sube tus imágenes a ningún servidor, porque todo el proceso de ajuste y compresión ocurre dentro de tu propio navegador.
