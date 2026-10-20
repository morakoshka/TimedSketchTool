
/*
  Timed Sketch Tool
  Módulo de controles de sesión
*/

const btnIniciar = document.getElementById("btnIniciar");
const selectorCantidad = document.getElementById("cantidad");
const checkboxAleatorio = document.getElementById("aleatorio");
const selectorCategoria = document.getElementById("categoria-referencia");

// Mezclar imágenes aleatoriamente.
function mezclarImagenes(lista) {
    const resultado = [...lista];

    for (let i = resultado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [resultado[i], resultado[j]] =
            [resultado[j], resultado[i]];
    }

    return resultado;
}

// Iniciar una sesión de práctica.
function iniciarSesion() {
    if (imagenes.length === 0) {
        alert("Primero selecciona imágenes.");
        return;
    }

    const cantidad = Number(selectorCantidad.value);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert("Selecciona una cantidad válida.");
        return;
    }

    if (selectorDuracion.value === "libre") {
        alert("El modo libre todavía está pendiente.");
        return;
    }

    // Obtener la categoría seleccionada.
    const categoriaSeleccionada = selectorCategoria.value;

    // Copiar las imágenes cargadas.
    let disponibles = [...imagenes];

    // Filtrar si se eligió una categoría específica.
    if (categoriaSeleccionada !== "todas") {
        disponibles = disponibles.filter(function (url) {
            return categoriasImagenes.get(url) ===
                categoriaSeleccionada;
        });
    }

    // Verificar que existan imágenes en esa categoría.
    if (disponibles.length === 0) {
        alert(
            "No hay imágenes disponibles en la categoría seleccionada."
        );
        return;
    }

    // Mezclar si el usuario activó el orden aleatorio.
    if (checkboxAleatorio.checked) {
        disponibles = mezclarImagenes(disponibles);
    }

    // No utilizar más imágenes de las disponibles.
    const cantidadFinal = Math.min(
        cantidad,
        disponibles.length
    );

    detenerTemporizador();

    // Preparar la sesión.
    imagenesSesion = disponibles.slice(0, cantidadFinal);
    indiceActual = 0;
    sesionActiva = true;

    mostrarImagen();
    iniciarTemporizador();
}

// Finalizar una sesión.
function finalizarSesion() {
    sesionActiva = false;
    detenerTemporizador();

    alert(
        "¡Sesión terminada! Completaste " +
        imagenesSesion.length +
        " imágenes."
    );
}

// Avanzar automáticamente cuando se agote el tiempo.
document.addEventListener("tiempoAgotado", function () {
    if (!sesionActiva) return;

    if (indiceActual < imagenesSesion.length - 1) {
        indiceActual++;

        mostrarImagen();
        iniciarTemporizador();
    } else {
        finalizarSesion();
    }
});

// Iniciar al presionar el botón.
btnIniciar.addEventListener("click", iniciarSesion);
