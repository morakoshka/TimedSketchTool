
/*
    MÓDULO DEL TEMPORIZADOR
    Timed Sketch Tool

    Se encarga de:
    - Iniciar una cuenta regresiva.
    - Pausar y reanudar.
    - Detener el reloj.
    - Avisar cuando termina el tiempo.
*/

const selectorDuracion = document.getElementById("duracion");
const reloj = document.getElementById("temporizador");
const btnPausar = document.getElementById("btnPausar");

let tiempoRestante = 30;
let intervalo = null;
let pausado = false;


// CONVERTIR SEGUNDOS A MM:SS
function formatearTiempo(segundos) {

    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return String(minutos).padStart(2, "0") + ":" +
           String(segundosRestantes).padStart(2, "0");
}


// ACTUALIZAR EL RELOJ
function actualizarReloj() {
    reloj.textContent = formatearTiempo(tiempoRestante);
}


// OBTENER LA DURACIÓN ELEGIDA
function obtenerDuracion() {
    return Number(selectorDuracion.value);
}


// EJECUTAR CADA SEGUNDO
function avanzarTemporizador() {

    tiempoRestante--;
    actualizarReloj();

    // Comprobar si terminó el tiempo.
    if (tiempoRestante <= 0) {

        clearInterval(intervalo);
        intervalo = null;

        // Avisar al módulo de sesiones.
        document.dispatchEvent(new Event("tiempoAgotado"));
    }
}


// INICIAR TEMPORIZADOR
function iniciarTemporizador() {

    clearInterval(intervalo);
    intervalo = null;

    const duracion = obtenerDuracion();

    if (!Number.isFinite(duracion) || duracion <= 0) {
        alert("Selecciona una duración válida.");
        return;
    }

    tiempoRestante = duracion;
    pausado = false;

    btnPausar.textContent = "Pausar";

    actualizarReloj();

    intervalo = setInterval(avanzarTemporizador, 1000);
}


// PAUSAR O REANUDAR
function alternarPausa() {

    // No hacer nada si no hay sesión activa.
    if (!sesionActiva) {
        return;
    }

    if (!pausado) {

        clearInterval(intervalo);
        intervalo = null;

        pausado = true;
        btnPausar.textContent = "Reanudar";

    } else {

        pausado = false;
        btnPausar.textContent = "Pausar";

        intervalo = setInterval(avanzarTemporizador, 1000);
    }
}


// DETENER TEMPORIZADOR
function detenerTemporizador() {

    clearInterval(intervalo);
    intervalo = null;

    tiempoRestante = 0;
    pausado = false;

    btnPausar.textContent = "Pausar";

    actualizarReloj();
}


// ACTIVAR BOTÓN PAUSAR
btnPausar.addEventListener("click", alternarPausa);

// Mostrar duración inicial.
actualizarReloj();
