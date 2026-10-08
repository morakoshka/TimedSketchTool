
const inputImagenes = document.getElementById("referencias");
const imagenReferencia = document.getElementById("imagenReferencia");
const mensajeReferencia = document.getElementById("mensajeReferencia");

const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

const imagenActual = document.getElementById("imagenActual");
const totalImagenes = document.getElementById("totalImagenes");

let imagenes = [];
let indiceActual = 0;

// Detectar cuando el usuario selecciona imágenes.
inputImagenes.addEventListener("change", function () {

    // Liberar las imágenes cargadas anteriormente.
    imagenes.forEach(function (url) {
        URL.revokeObjectURL(url);
    });

    imagenes = [];

    const archivos = Array.from(inputImagenes.files);

    // Aceptar únicamente archivos de imagen.
    const archivosValidos = archivos.filter(function (archivo) {
        return archivo.type.startsWith("image/");
    });

    archivosValidos.forEach(function (archivo) {
        const url = URL.createObjectURL(archivo);
        imagenes.push(url);
    });

    indiceActual = 0;
    mostrarImagen();
});

// Mostrar la imagen seleccionada.
function mostrarImagen() {

    if (imagenes.length === 0) {
        imagenReferencia.hidden = true;
        imagenReferencia.removeAttribute("src");
        mensajeReferencia.hidden = false;

        imagenActual.textContent = "0";
        totalImagenes.textContent = "0";
        return;
    }

    imagenReferencia.src = imagenes[indiceActual];
    imagenReferencia.hidden = false;
    mensajeReferencia.hidden = true;

    imagenActual.textContent = indiceActual + 1;
    totalImagenes.textContent = imagenes.length;
}

// Avanzar a la siguiente imagen.
btnSiguiente.addEventListener("click", function () {

    if (indiceActual < imagenes.length - 1) {
        indiceActual++;
        mostrarImagen();
    }

});

// Regresar a la imagen anterior.
btnAnterior.addEventListener("click", function () {

    if (indiceActual > 0) {
        indiceActual--;
        mostrarImagen();
    }

});
