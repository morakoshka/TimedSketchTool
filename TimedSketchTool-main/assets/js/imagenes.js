
/*
  Timed Sketch Tool
  Módulo de carga de imágenes y categorías
*/

const inputImagenes = document.getElementById("referencias");
const imagenReferencia = document.getElementById("imagenReferencia");
const mensajeReferencia = document.getElementById("mensajeReferencia");
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");
const imagenActual = document.getElementById("imagenActual");
const totalImagenes = document.getElementById("totalImagenes");

// Imágenes cargadas y sesión actual.
let imagenes = [];
let imagenesSesion = [];
let indiceActual = 0;
let sesionActiva = false;

// Guarda la categoría de cada imagen.
const categoriasImagenes = new Map();

// Crear contenedor para asignar categorías.
const contenedorCategorias = document.createElement("div");
contenedorCategorias.id = "contenedorCategorias";
contenedorCategorias.hidden = true;

inputImagenes.insertAdjacentElement(
    "afterend",
    contenedorCategorias
);

// Cargar imágenes desde la computadora.
inputImagenes.addEventListener("change", function () {
    sesionActiva = false;
    contextoSesionGaleria = null;
    detenerTemporizador();
    document.dispatchEvent(new CustomEvent("sesionGaleriaDisponible", {
        detail: null
    }));

    // Liberar las imágenes anteriores.
    imagenes.forEach(function (url) {
        URL.revokeObjectURL(url);
    });

    imagenes = [];
    imagenesSesion = [];
    indiceActual = 0;

    categoriasImagenes.clear();
    contenedorCategorias.replaceChildren();
    contenedorCategorias.hidden = true;

    const archivos = Array.from(inputImagenes.files);

    const archivosValidos = archivos.filter(function (archivo) {
        return archivo.type.startsWith("image/");
    });

    if (archivosValidos.length > 0) {
        const titulo = document.createElement("h3");
        titulo.textContent = "Categorías de las imágenes";
        contenedorCategorias.appendChild(titulo);

        const descripcion = document.createElement("p");
        descripcion.textContent =
            "Asigna una categoría a cada referencia.";
        contenedorCategorias.appendChild(descripcion);
    }

    archivosValidos.forEach(function (archivo, indice) {
        const url = URL.createObjectURL(archivo);

        imagenes.push(url);

        // Categoría inicial.
        categoriasImagenes.set(url, "sin_categoria");

        // Crear fila para la imagen.
        const fila = document.createElement("div");
        fila.className = "fila-categoria";

        const etiqueta = document.createElement("label");
        etiqueta.htmlFor = "categoriaImagen" + indice;
        etiqueta.textContent = archivo.name;

        const selector = document.createElement("select");
        selector.id = "categoriaImagen" + indice;

        const opciones = [
            ["sin_categoria", "Sin categoría"],
            ["poses", "Poses"],
            ["rostros", "Rostros"],
            ["manos", "Manos"],
            ["anatomia", "Anatomía"]
        ];

        opciones.forEach(function (opcion) {
            const elemento = document.createElement("option");

            elemento.value = opcion[0];
            elemento.textContent = opcion[1];

            selector.appendChild(elemento);
        });

        // Guardar cambios de categoría.
        selector.addEventListener("change", function () {
            categoriasImagenes.set(url, selector.value);
        });

        fila.appendChild(etiqueta);
        fila.appendChild(selector);

        contenedorCategorias.appendChild(fila);
    });

    contenedorCategorias.hidden = imagenes.length === 0;

    mostrarImagen();
});

// Mostrar la imagen correspondiente.
function mostrarImagen() {
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

    imagenActual.textContent = indiceActual + 1;
    totalImagenes.textContent = lista.length;
}

// Cambiar de referencia.
function cambiarImagen(direccion) {
    const lista = imagenesSesion.length > 0
        ? imagenesSesion
        : imagenes;

    if (lista.length === 0) return;

    const nuevoIndice = indiceActual + direccion;

    if (nuevoIndice < 0 || nuevoIndice >= lista.length) {
        return;
    }

    indiceActual = nuevoIndice;
    mostrarImagen();

    if (sesionActiva) {
        iniciarTemporizador();
    }
}

// Botones de navegación.
btnSiguiente.addEventListener("click", function () {
    cambiarImagen(1);
});

btnAnterior.addEventListener("click", function () {
    cambiarImagen(-1);
});
