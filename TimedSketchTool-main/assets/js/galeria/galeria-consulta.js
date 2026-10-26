(function (galeria) {
    const ui = galeria.ui;

    // Solicita la galería privada con filtros y descarta respuestas obsoletas.
    galeria.cargar = async function () {
        if (!galeria.usuario) {
            return false;
        }

        const solicitudActual = ++galeria.solicitud;
        const usuarioActual = galeria.usuario;
        ui.listaGaleria.replaceChildren();
        ui.galeriaMensaje.textContent = "Cargando tus dibujos...";

        try {
            const categoria = ui.filtroGaleria.value;
            if (ui.fechaDesde.value && ui.fechaHasta.value &&
                ui.fechaDesde.value > ui.fechaHasta.value) {
                ui.galeriaMensaje.textContent =
                    "La fecha inicial no puede ser posterior a la fecha final.";
                return false;
            }

            const parametros = new URLSearchParams({
                action: "drawings",
                category: categoria
            });
            if (ui.fechaDesde.value) {
                parametros.set("date_from", ui.fechaDesde.value);
            }
            if (ui.fechaHasta.value) {
                parametros.set("date_to", ui.fechaHasta.value);
            }

            const respuesta = await fetch(
                "api.php?" + parametros.toString(),
                { credentials: "same-origin" }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || "No se pudo cargar la galería.");
            }
            // Un cambio de filtro o de cuenta puede dejar una petición anterior en vuelo.
            if (solicitudActual !== galeria.solicitud ||
                galeria.usuario !== usuarioActual) {
                return false;
            }

            if (datos.drawings.length === 0) {
                const hayFiltros = categoria !== "todas" ||
                    ui.fechaDesde.value !== "" || ui.fechaHasta.value !== "";
                ui.galeriaMensaje.textContent = hayFiltros
                    ? "No hay dibujos que coincidan con los filtros seleccionados."
                    : "Aún no has guardado dibujos. Usa “Guardar dibujo” para agregar el primero.";
                return true;
            }

            ui.galeriaMensaje.textContent = "";
            datos.drawings.forEach(crearTarjetaDibujo);
            return true;
        } catch (error) {
            if (solicitudActual === galeria.solicitud &&
                galeria.usuario === usuarioActual) {
                galeria.mostrarError(ui.galeriaMensaje, error);
            }
            return false;
        }
    };

    // Cada tarjeta resume el dibujo y conecta con la vista de detalle y eliminación.
    function crearTarjetaDibujo(dibujo) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "gallery-card";

        const imagen = document.createElement("img");
        imagen.src = "api.php?action=image&id=" + encodeURIComponent(dibujo.id);
        imagen.alt = dibujo.title;
        imagen.loading = "lazy";

        const titulo = document.createElement("h3");
        titulo.textContent = dibujo.title;

        const descripcion = document.createElement("p");
        descripcion.className = "gallery-description";
        descripcion.textContent = dibujo.description || "Sin descripción.";

        const categoria = document.createElement("p");
        categoria.textContent =
            "Categoría: " + galeria.etiquetaCategoria(dibujo.category);

        const fecha = document.createElement("time");
        fecha.dateTime = dibujo.drawing_date;
        fecha.textContent = "Fecha del dibujo: " +
            galeria.formatearFecha(dibujo.drawing_date);

        const botonDetalles = document.createElement("button");
        botonDetalles.type = "button";
        botonDetalles.textContent = "Ver dibujo y detalles";
        botonDetalles.addEventListener("click", function () {
            galeria.mostrarDetalle(dibujo);
        });

        tarjeta.append(
            imagen,
            titulo,
            descripcion,
            categoria,
            fecha,
            botonDetalles,
            galeria.crearBotonEliminar(dibujo)
        );
        ui.listaGaleria.appendChild(tarjeta);
    }

    function agregarDatoDetalle(contenedor, etiqueta, valor) {
        const termino = document.createElement("dt");
        termino.textContent = etiqueta;
        const descripcion = document.createElement("dd");
        descripcion.textContent = valor;
        contenedor.append(termino, descripcion);
    }

    // Construye los detalles con textContent para tratar los metadatos como texto.
    galeria.mostrarDetalle = function (dibujo) {
        galeria.dibujoSeleccionado = dibujo;
        ui.detalleTitulo.textContent = dibujo.title;
        ui.detalleImagen.src =
            "api.php?action=image&id=" + encodeURIComponent(dibujo.id);
        ui.detalleImagen.alt = "Dibujo: " + dibujo.title;
        ui.formEditarDibujo.hidden = true;
        ui.btnEditarDibujo.hidden = false;
        ui.mensajeEdicion.textContent = "";
        ui.detalleInformacion.replaceChildren();
        agregarDatoDetalle(
            ui.detalleInformacion,
            "Descripción",
            dibujo.description || "Sin descripción."
        );
        agregarDatoDetalle(
            ui.detalleInformacion,
            "Categoría",
            galeria.etiquetaCategoria(dibujo.category)
        );
        agregarDatoDetalle(
            ui.detalleInformacion,
            "Fecha del dibujo",
            galeria.formatearFecha(dibujo.drawing_date)
        );

        ui.detalleInformacionSesion.replaceChildren();
        const tieneSesion = Boolean(dibujo.session_started_at);
        ui.detalleSesion.hidden = !tieneSesion;
        if (tieneSesion) {
            const minutos = Math.floor(dibujo.session_duration_seconds / 60);
            const segundos = dibujo.session_duration_seconds % 60;
            const duracion = minutos > 0
                ? minutos + " min" + (segundos > 0 ? " " + segundos + " s" : "")
                : segundos + " s";
            agregarDatoDetalle(
                ui.detalleInformacionSesion,
                "Duración por imagen",
                duracion
            );
            agregarDatoDetalle(
                ui.detalleInformacionSesion,
                "Imágenes de la sesión",
                String(dibujo.session_image_count)
            );
            agregarDatoDetalle(
                ui.detalleInformacionSesion,
                "Categoría de referencias",
                galeria.etiquetaCategoria(dibujo.session_category)
            );
            agregarDatoDetalle(
                ui.detalleInformacionSesion,
                "Inicio de la sesión",
                new Date(dibujo.session_started_at.replace(" ", "T") + "Z")
                    .toLocaleString("es-MX")
            );
        }

        if (!ui.detalleDibujo.open) {
            ui.detalleDibujo.showModal();
        }
    };

    document.getElementById("btnCerrarDetalle").addEventListener("click", function () {
        ui.detalleDibujo.close();
    });
    ui.detalleDibujo.addEventListener("click", function (evento) {
        if (evento.target === ui.detalleDibujo) {
            ui.detalleDibujo.close();
        }
    });
})(window.Galeria);
