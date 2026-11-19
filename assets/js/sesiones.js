(function (practica) {
    const botonIniciar = document.getElementById("btnIniciar");

    practica.actualizarEstadoControles = function () {
        const hayReferencias = practica.referencias.length > 0;
        const indice = practica.indiceActual;
        const total = practica.sesionActiva
            ? practica.imagenesSesion.length
            : practica.referencias.length;
        document.getElementById("btnAnterior").disabled =
            !hayReferencias || indice === 0;
        document.getElementById("btnSiguiente").disabled =
            !hayReferencias || (!practica.sesionActiva && indice >= total - 1);
        document.getElementById("btnPausar").disabled = !practica.sesionActiva;
    };

    // Un ejercicio se contabiliza una sola vez por posición de la sesión.
    practica.registrarEjercicioCompletado = function () {
        if (!practica.sesionActiva) {
            return;
        }
        practica.ejerciciosContabilizados.add(practica.indiceActual);
        practica.ejerciciosCompletados = practica.ejerciciosContabilizados.size;
    };

    practica.finalizarSesion = function (completarEjercicioActual) {
        if (!practica.sesionActiva) {
            return;
        }
        practica.tiempoTotalSegundos +=
            window.temporizadorPractica.segundosTranscurridos();
        if (completarEjercicioActual) {
            practica.registrarEjercicioCompletado();
        }
        practica.sesionActiva = false;
        window.temporizadorPractica.detener();
        practica.actualizarEstadoControles();
        document.dispatchEvent(new CustomEvent("sesionFinalizada", {
            detail: {
                ejerciciosRealizados: practica.ejerciciosCompletados,
                imagenesSeleccionadas: practica.imagenesSesion.length,
                tiempoTotalSegundos: practica.tiempoTotalSegundos,
                modoLibre: practica.seleccion.modoLibre
            }
        }));
    };

    function iniciarSesion() {
        try {
            if (practica.referencias.length === 0) {
                throw new Error("Primero selecciona imágenes.");
            }
            const configuracion = practica.obtenerConfiguracion();
            practica.imagenesSesion = practica.seleccionarImagenes(configuracion);
            practica.seleccion = configuracion;
            practica.indiceActual = 0;
            practica.ejerciciosCompletados = 0;
            practica.ejerciciosContabilizados.clear();
            practica.tiempoTotalSegundos = 0;
            practica.sesionActiva = true;
            practica.contextoSesionGaleria = {
                startedAt: new Date().toISOString(),
                durationSeconds: configuracion.duracionSegundos,
                freeMode: configuracion.modoLibre,
                imageCount: practica.imagenesSesion.length,
                category: configuracion.categoria
            };
            practica.actualizarEstadoControles();
            practica.mostrarImagen();
            window.temporizadorPractica.iniciar(configuracion);
            document.dispatchEvent(new CustomEvent("sesionGaleriaDisponible", {
                detail: practica.contextoSesionGaleria
            }));
            document.dispatchEvent(new Event("sesionIniciada"));
            document.getElementById("practica").focus();
        } catch (error) {
            alert(error.message);
        }
    }

    document.addEventListener("tiempoAgotado", function () {
        if (practica.sesionActiva) {
            practica.cambiarImagen(1);
        }
    });
    botonIniciar.addEventListener("click", iniciarSesion);
    practica.actualizarEstadoControles();
})(window.TST);
