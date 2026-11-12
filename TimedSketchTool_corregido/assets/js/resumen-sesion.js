(function () {
    const seccion = document.getElementById("resumen-sesion");
    const ejercicios = document.getElementById("resumen-ejercicios");
    const tiempo = document.getElementById("resumen-tiempo");
    const detalle = document.getElementById("resumen-detalle");

    function formatearDuracion(segundos) {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const resto = segundos % 60;
        const partes = [];
        if (horas) {
            partes.push(horas + (horas === 1 ? " hora" : " horas"));
        }
        if (minutos) {
            partes.push(minutos + (minutos === 1 ? " minuto" : " minutos"));
        }
        if (resto || partes.length === 0) {
            partes.push(resto + (resto === 1 ? " segundo" : " segundos"));
        }
        return partes.join(" ");
    }

    document.addEventListener("sesionIniciada", function () {
        seccion.hidden = true;
    });
    document.addEventListener("sesionFinalizada", function (evento) {
        const resumen = evento.detail;
        ejercicios.textContent = String(resumen.ejerciciosRealizados);
        tiempo.textContent = formatearDuracion(resumen.tiempoTotalSegundos);
        detalle.textContent = resumen.modoLibre
            ? "Modo libre · " + resumen.imagenesSeleccionadas + " imágenes seleccionadas"
            : resumen.imagenesSeleccionadas + " imágenes seleccionadas";
        seccion.hidden = false;
        seccion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
})();
