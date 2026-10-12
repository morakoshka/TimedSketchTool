
/*
    CONTROL DE SESIONES
    Timed Sketch Tool

    Se encarga de:
    - Iniciar sesiones.
    - Elegir cantidad de imágenes.
    - Cambiar imágenes automáticamente.
    - Finalizar la sesión.
*/

const btnIniciar = document.getElementById("btnIniciar");
const selectorCantidad = document.getElementById("cantidad");


// INICIAR SESIÓN
function iniciarSesion() {

    // Verificar que existan imágenes.
    if (imagenes.length === 0) {
        alert("Primero selecciona imágenes.");
        return;
    }

    // Obtener la cantidad de imágenes solicitada.
    const cantidad = Number(selectorCantidad.value);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert("Selecciona una cantidad válida.");
        return;
    }

    // El modo libre se programará después.
    if (selectorDuracion.value === "libre") {
        alert("El modo libre todavía no está disponible.");
        return;
    }

    // No usar más imágenes de las que tenemos.
    const cantidadFinal = Math.min(cantidad, imagenes.length);

    // Detener una sesión anterior, si existe.
    detenerTemporizador();

    // Crear lista de imágenes para esta sesión.
    imagenesSesion = imagenes.slice(0, cantidadFinal);

    // Reiniciar la posición.
    indiceActual = 0;

    // Marcar la sesión como activa.
    sesionActiva = true;

    // Mostrar la primera imagen.
    mostrarImagen();

    // Iniciar el reloj.
    iniciarTemporizador();
}


// FINALIZAR SESIÓN
function finalizarSesion() {

    sesionActiva = false;

    detenerTemporizador();

    alert(
        "¡Sesión terminada! Completaste " +
        imagenesSesion.length +
        " imágenes."
    );
}


// CUANDO SE TERMINA EL TIEMPO
document.addEventListener("tiempoAgotado", function () {

    // Ignorar si no estamos practicando.
    if (!sesionActiva) {
        return;
    }

    // Verificar si hay otra imagen.
    if (indiceActual < imagenesSesion.length - 1) {

        // Avanzar a la siguiente.
        indiceActual++;

        // Actualizar la fotografía.
        mostrarImagen();

        // Reiniciar el reloj.
        iniciarTemporizador();

    } else {

        // No quedan más imágenes.
        finalizarSesion();
    }
});


// ACTIVAR BOTÓN INICIAR
btnIniciar.addEventListener("click", iniciarSesion);
