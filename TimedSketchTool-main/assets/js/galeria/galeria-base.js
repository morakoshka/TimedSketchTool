// Contrato compartido: cargar este archivo primero para que los módulos registren sus funciones.
window.Galeria = {
    ui: {
        cuentaMensaje: document.getElementById("cuenta-mensaje"),
        cuentaForms: document.getElementById("formularios-cuenta"),
        cuentaActiva: document.getElementById("cuenta-activa"),
        cuentaCorreo: document.getElementById("cuenta-correo"),
        galeriaMensaje: document.getElementById("galeria-mensaje"),
        galeriaUsuario: document.getElementById("galeria-usuario"),
        btnCerrarSesion: document.getElementById("btnCerrarSesion"),
        btnAgregarDibujo: document.getElementById("btnAgregarDibujo"),
        archivoDibujo: document.getElementById("archivo-dibujo"),
        tituloDibujo: document.getElementById("titulo-dibujo"),
        descripcionDibujo: document.getElementById("descripcion-dibujo"),
        categoriaDibujo: document.getElementById("categoria-dibujo"),
        fechaDibujo: document.getElementById("fecha-dibujo"),
        incluirSesion: document.getElementById("incluir-sesion"),
        estadoSesionDibujo: document.getElementById("estado-sesion-dibujo"),
        filtroGaleria: document.getElementById("filtro-galeria"),
        fechaDesde: document.getElementById("fecha-desde"),
        fechaHasta: document.getElementById("fecha-hasta"),
        btnLimpiarFiltros: document.getElementById("btnLimpiarFiltros"),
        controlesGaleria: document.getElementById("controles-galeria"),
        listaGaleria: document.getElementById("lista-galeria"),
        detalleDibujo: document.getElementById("detalle-dibujo"),
        detalleTitulo: document.getElementById("detalle-titulo"),
        detalleImagen: document.getElementById("detalle-imagen"),
        detalleInformacion: document.getElementById("detalle-informacion"),
        detalleSesion: document.getElementById("detalle-sesion"),
        detalleInformacionSesion: document.getElementById("detalle-informacion-sesion"),
        btnEditarDibujo: document.getElementById("btnEditarDibujo"),
        formEditarDibujo: document.getElementById("form-editar-dibujo"),
        editarTitulo: document.getElementById("editar-titulo"),
        editarDescripcion: document.getElementById("editar-descripcion"),
        editarCategoria: document.getElementById("editar-categoria"),
        editarFecha: document.getElementById("editar-fecha"),
        mensajeEdicion: document.getElementById("mensaje-edicion"),
        btnGuardarEdicion: document.getElementById("btnGuardarEdicion")
    },
    tokenCsrf: "",
    usuario: null,
    solicitud: 0,
    contextoSesion: null,
    dibujoSeleccionado: null
};

(function (galeria) {
    async function solicitarApi(accion, opciones = {}) {
        const respuesta = await fetch(
            "api.php?action=" + encodeURIComponent(accion),
            {
                credentials: "same-origin",
                ...opciones,
                headers: {
                    ...(opciones.body instanceof FormData
                        ? {}
                        : { "Content-Type": "application/json" }),
                    ...(opciones.headers || {})
                }
            }
        );

        const datos = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(datos.error || "No se pudo completar la solicitud.");
        }
        return datos;
    }

    galeria.solicitarApi = solicitarApi;
    galeria.mostrarError = function (elemento, error) {
        elemento.textContent = error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.";
    };
    galeria.fechaLocalActual = function () {
        const ahora = new Date();
        const desplazamiento = ahora.getTimezoneOffset() * 60000;
        return new Date(ahora.getTime() - desplazamiento)
            .toISOString()
            .slice(0, 10);
    };
    galeria.formatearFecha = function (fecha) {
        const [anio, mes, dia] = fecha.split("-").map(Number);
        return new Date(anio, mes - 1, dia).toLocaleDateString("es-MX");
    };
    galeria.etiquetaCategoria = function (categoria) {
        const etiquetas = {
            todas: "Todas",
            sin_categoria: "Sin categoría",
            poses: "Poses",
            rostros: "Rostros",
            manos: "Manos",
            anatomia: "Anatomía"
        };
        return etiquetas[categoria] || "Sin categoría";
    };

    // La práctica publica una instantánea opcional para asociarla a un dibujo guardado.
    document.addEventListener("sesionGaleriaDisponible", function (evento) {
        const ui = galeria.ui;
        galeria.contextoSesion = evento.detail;
        ui.incluirSesion.disabled = !galeria.contextoSesion;
        if (!galeria.contextoSesion) {
            ui.incluirSesion.checked = false;
        }
        ui.estadoSesionDibujo.textContent = galeria.contextoSesion
            ? "Sesión disponible: " + galeria.contextoSesion.imageCount +
                " imágenes, " + galeria.contextoSesion.durationSeconds +
                " segundos por imagen."
            : "Inicia una sesión de práctica para poder vincularla.";
    });

    galeria.ui.fechaDibujo.value = galeria.fechaLocalActual();
})(window.Galeria);
