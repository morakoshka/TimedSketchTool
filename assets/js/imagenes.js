
/*
    MÓDULO DE IMÁGENES
    Timed Sketch Tool

    Se encarga de:
    - Cargar imágenes locales.
    - Mostrar fotografías.
    - Navegar entre imágenes.
    - Actualizar el contador.
*/

const inputImagenes = document.getElementById("referencias");
const imagenReferencia = document.getElementById("imagenReferencia");
const mensajeReferencia = document.getElementById("mensajeReferencia");

const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

const imagenActual = document.getElementById("imagenActual");
const totalImagenes = document.getElementById("totalImagenes");

// Todas las imágenes cargadas.
let imagenes = [];

// Imágenes elegidas para la sesión actual.
let imagenesSesion = [];

// Posición de la imagen que estamos mostrando.
let indiceActual = 0;

// Indica si hay una sesión en curso.
let sesionActiva = false;


// CARGAR IMÁGENES
inputImagenes.addEventListener("change", function () {

    // Detener cualquier sesión anterior.
    sesionActiva = false;
    detenerTemporizador();

    // Liberar las imágenes anteriores de la memoria.
    imagenes.forEach(function (url) {
        URL.revokeObjectURL(url);
    });

    imagenes = [];
    imagenesSesion = [];
    indiceActual = 0;

    // Obtener los archivos seleccionados.
    const archivos = Array.from(inputImagenes.files);

    // Aceptar solamente imágenes.
    const archivosValidos = archivos.filter(function (archivo) {
        return archivo.type.startsWith("image/");
    });

    // Crear una URL temporal para cada imagen.
    archivosValidos.forEach(function (archivo) {
        const url = URL.createObjectURL(archivo);
        imagenes.push(url);
    });

    mostrarImagen();
});


// MOSTRAR IMAGEN
function mostrarImagen() {

    // Si existe una sesión, usar su lista de imágenes.
    const lista = imagenesSesion.length > 0
        ? imagenesSesion
        : imagenes;

    if (lista.length === 0) {

        imagenReferencia.hidden = true;
        imagenReferencia.removeAttribute("src");
        mensajeReferencia.hidden = false;

        imagenActual.textContent = "0";
        totalImagenes.textContent = "0";

        return;
    }

    imagenReferencia.src = lista[indiceActual];
    imagenReferencia.hidden = false;
    mensajeReferencia.hidden = true;

    // Actualizar contador.
    imagenActual.textContent = indiceActual + 1;
    totalImagenes.textContent = lista.length;
}


// CAMBIAR IMAGEN
function cambiarImagen(direccion) {

    const lista = imagenesSesion.length > 0
        ? imagenesSesion
        : imagenes;

    if (lista.length === 0) {
        return;
    }

    const nuevoIndice = indiceActual + direccion;

    // Evitar posiciones fuera del arreglo.
    if (nuevoIndice < 0 || nuevoIndice >= lista.length) {
        return;
    }

    indiceActual = nuevoIndice;

    mostrarImagen();

    // Durante una sesión, reiniciar el tiempo.
    if (sesionActiva) {
        iniciarTemporizador();
    }
}


// BOTÓN SIGUIENTE
btnSiguiente.addEventListener("click", function () {
    cambiarImagen(1);
});


// BOTÓN ANTERIOR
btnAnterior.addEventListener("click", function () {
    cambiarImagen(-1);
});
