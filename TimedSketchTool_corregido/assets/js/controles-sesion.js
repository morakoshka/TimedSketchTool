(function (practica) {
    practica.cambiarImagen = function (direccion) {
        const lista = practica.sesionActiva
            ? practica.imagenesSesion
            : practica.referencias.map(function (referencia) {
                return referencia.url;
            });
        if (lista.length === 0) {
            return;
        }

        const nuevoIndice = practica.indiceActual + direccion;
        if (nuevoIndice < 0 || nuevoIndice >= lista.length) {
            if (practica.sesionActiva && direccion > 0 &&
                nuevoIndice >= lista.length) {
                practica.finalizarSesion(true);
            }
            return;
        }

        if (practica.sesionActiva) {
            practica.tiempoTotalSegundos +=
                window.temporizadorPractica.segundosTranscurridos();
            if (direccion > 0) {
                practica.registrarEjercicioCompletado();
            }
        }
        practica.indiceActual = nuevoIndice;
        practica.mostrarImagen();
        practica.actualizarEstadoControles();
        if (practica.sesionActiva) {
            window.temporizadorPractica.iniciar(practica.seleccion);
        }
    };

    document.getElementById("btnSiguiente").addEventListener("click", function () {
        practica.cambiarImagen(1, false);
    });
    document.getElementById("btnAnterior").addEventListener("click", function () {
        practica.cambiarImagen(-1, false);
    });
})(window.TST);
