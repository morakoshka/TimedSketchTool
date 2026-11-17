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
        enlaceAdmin: document.getElementById("enlace-admin"),
        panelAdmin: document.getElementById("administracion"),
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
    categorias: [],
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
        if (categoria === "todas") {
            return "Todas";
        }
        const opcion = galeria.categorias.find(function (item) {
            return item.slug === categoria;
        });
        return opcion ? opcion.label : "Sin categoría";
    };

    galeria.actualizarCategorias = function (categorias) {
        galeria.categorias = categorias;
        const selectores = [
            { elemento: document.getElementById("categoria-referencia"), todas: true },
            { elemento: galeria.ui.categoriaDibujo, todas: false },
            { elemento: galeria.ui.filtroGaleria, todas: true },
            { elemento: galeria.ui.editarCategoria, todas: false }
        ];
        selectores.forEach(function (item) {
            const anterior = item.elemento.value;
            item.elemento.replaceChildren();
            if (item.todas) {
                const opcionTodas = document.createElement("option");
                opcionTodas.value = "todas";
                opcionTodas.textContent = "Todas";
                item.elemento.appendChild(opcionTodas);
            }
            categorias.forEach(function (categoria) {
                const opcion = document.createElement("option");
                opcion.value = categoria.slug;
                opcion.textContent = categoria.label;
                item.elemento.appendChild(opcion);
            });
            item.elemento.value = categorias.some(function (categoria) {
                return categoria.slug === anterior;
            }) ? anterior : (item.todas ? "todas" : "sin_categoria");
        });
        if (typeof window.actualizarCategoriasDisponibles === "function") {
            window.actualizarCategoriasDisponibles(categorias);
        }
    };
    galeria.aplicarConfiguracion = function (configuracion) {
        document.title = configuracion.app_title;
        const marca = document.querySelector(".brand");
        marca.setAttribute("aria-label", configuracion.app_title + ", inicio");
        marca.querySelector(".sr-only").textContent = configuracion.app_title;
        marca.querySelector(".brand-logo").alt = configuracion.app_title;
        document.getElementById("mensaje-bienvenida").textContent =
            configuracion.welcome_message;
        document.getElementById("duracion").value =
            String(configuracion.default_duration_seconds);
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
            ? galeria.contextoSesion.freeMode
                ? "Sesión disponible en modo libre: " +
                    galeria.contextoSesion.imageCount + " imágenes."
                : "Sesión disponible: " + galeria.contextoSesion.imageCount +
                    " imágenes, " + galeria.contextoSesion.durationSeconds +
                    " segundos por imagen."
            : "Inicia una sesión de práctica para poder vincularla.";
    });

    galeria.ui.fechaDibujo.value = galeria.fechaLocalActual();
})(window.Galeria);
