
const selectorDuracion = document.getElementById("duracion");
const reloj = document.getElementById("temporizador");
const btnIniciar = document.getElementById("btnIniciar");
const btnPausar = document.getElementById("btnPausar");

let tiempoRestante = 30;
let intervalo = null;
let pausado = false;

// Convertir segundos al formato MM:SS.
function formatearTiempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return String(minutos).padStart(2, "0") + ":" +
           String(segundosRestantes).padStart(2, "0");
}

// Mostrar el tiempo en pantalla.
function actualizarReloj() {
    reloj.textContent = formatearTiempo(tiempoRestante);
}

// Obtener el tiempo elegido por el usuario.
function obtenerDuracion() {
    return Number(selectorDuracion.value);
}

// Iniciar una cuenta regresiva.
function iniciarTemporizador() {
    clearInterval(intervalo);

    tiempoRestante = obtenerDuracion();

    if (!Number.isFinite(tiempoRestante) ||
        tiempoRestante <= 0) {
        alert("Selecciona una duración válida.");
        return;
    }

    pausado = false;
    btnPausar.textContent = "Pausar";
    actualizarReloj();

    intervalo = setInterval(function () {
        tiempoRestante--;
        actualizarReloj();

        if (tiempoRestante <= 0) {
            clearInterval(intervalo);
            intervalo = null;
            alert("¡Tiempo terminado!");
        }
    }, 1000);
}

// Pausar o reanudar el reloj.
function alternarPausa() {
    if (intervalo === null && !pausado) {
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

        intervalo = setInterval(function () {
            tiempoRestante--;
            actualizarReloj();

            if (tiempoRestante <= 0) {
                clearInterval(intervalo);
                intervalo = null;
                alert("¡Tiempo terminado!");
            }
        }, 1000);
    }
}

btnIniciar.addEventListener("click", iniciarTemporizador);
btnPausar.addEventListener("click", alternarPausa);
