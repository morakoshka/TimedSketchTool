(function () {
    const selectorDuracion = document.getElementById("duracion");
    const reloj = document.getElementById("temporizador");
    const botonPausa = document.getElementById("btnPausar");
    let intervalo = null;
    let duracionSegundos = 30;
    let modoLibre = false;
    let segundosAcumulados = 0;
    let inicioTramo = 0;
    let pausado = false;

    function formatear(segundos) {
        const valor = Math.max(0, Math.floor(segundos));
        const horas = Math.floor(valor / 3600);
        const minutos = Math.floor((valor % 3600) / 60);
        const segundosRestantes = valor % 60;
        if (horas > 0) {
            return String(horas).padStart(2, "0") + ":" +
                String(minutos).padStart(2, "0") + ":" +
                String(segundosRestantes).padStart(2, "0");
        }
        return String(minutos).padStart(2, "0") + ":" +
            String(segundosRestantes).padStart(2, "0");
    }

    function transcurrido() {
        return segundosAcumulados + (intervalo === null || pausado
            ? 0
            : (Date.now() - inicioTramo) / 1000);
    }

    function actualizar() {
        const tiempo = transcurrido();
        if (modoLibre) {
            reloj.textContent = formatear(tiempo);
            return;
        }
        const restante = Math.max(0, duracionSegundos - Math.floor(tiempo));
        reloj.textContent = formatear(restante);
        if (restante === 0) {
            segundosAcumulados = duracionSegundos;
            pausado = true;
            detenerIntervalo();
            document.dispatchEvent(new Event("tiempoAgotado"));
        }
    }

    function detenerIntervalo() {
        if (intervalo !== null) {
            clearInterval(intervalo);
            intervalo = null;
        }
    }

    window.temporizadorPractica = {
        iniciar: function (configuracion) {
            detenerIntervalo();
            duracionSegundos = configuracion.duracionSegundos;
            modoLibre = configuracion.modoLibre;
            segundosAcumulados = 0;
            pausado = false;
            inicioTramo = Date.now();
            botonPausa.textContent = "Pausar";
            reloj.setAttribute(
                "aria-label",
                modoLibre ? "Tiempo transcurrido" : "Tiempo restante"
            );
            actualizar();
            intervalo = setInterval(actualizar, 200);
        },
        alternarPausa: function () {
            if (!window.TST.sesionActiva) {
                return;
            }
            if (pausado) {
                pausado = false;
                inicioTramo = Date.now();
                botonPausa.textContent = "Pausar";
                intervalo = setInterval(actualizar, 200);
            } else {
                segundosAcumulados = transcurrido();
                pausado = true;
                detenerIntervalo();
                botonPausa.textContent = "Reanudar";
                actualizar();
            }
        },
        detener: function () {
            detenerIntervalo();
            segundosAcumulados = 0;
            pausado = false;
            botonPausa.textContent = "Pausar";
            const libreSeleccionado = selectorDuracion.value === "libre";
            reloj.setAttribute(
                "aria-label",
                libreSeleccionado ? "Tiempo transcurrido" : "Tiempo restante"
            );
            reloj.textContent = libreSeleccionado
                ? "00:00"
                : formatear(Number(selectorDuracion.value) || 30);
        },
        segundosTranscurridos: function () {
            return Math.floor(transcurrido());
        },
        formatear: formatear
    };

    botonPausa.addEventListener("click", function () {
        window.temporizadorPractica.alternarPausa();
    });
    selectorDuracion.addEventListener("change", function () {
        if (!window.TST.sesionActiva) {
            const libre = selectorDuracion.value === "libre";
            reloj.setAttribute(
                "aria-label",
                libre ? "Tiempo transcurrido" : "Tiempo restante"
            );
            reloj.textContent = libre
                ? "00:00"
                : formatear(Number(selectorDuracion.value) || 30);
        }
    });
    botonPausa.disabled = true;
})();
