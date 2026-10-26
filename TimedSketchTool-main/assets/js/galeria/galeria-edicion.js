(function (galeria) {
    const ui = galeria.ui;

    // Carga los valores actuales en el formulario secundario del diálogo.
    ui.btnEditarDibujo.addEventListener("click", function () {
        const dibujo = galeria.dibujoSeleccionado;
        if (!dibujo) {
            return;
        }

        ui.editarTitulo.value = dibujo.title;
        ui.editarDescripcion.value = dibujo.description || "";
        ui.editarCategoria.value = dibujo.category;
        ui.editarFecha.value = dibujo.drawing_date;
        ui.mensajeEdicion.textContent = "";
        ui.btnEditarDibujo.hidden = true;
        ui.formEditarDibujo.hidden = false;
        ui.editarTitulo.focus();
    });

    document.getElementById("btnCancelarEdicion").addEventListener("click", function () {
        ui.formEditarDibujo.hidden = true;
        ui.btnEditarDibujo.hidden = false;
        ui.mensajeEdicion.textContent = "";
    });

    ui.formEditarDibujo.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const dibujo = galeria.dibujoSeleccionado;
        if (!dibujo || !ui.formEditarDibujo.reportValidity()) {
            return;
        }

        ui.mensajeEdicion.textContent = "";
        ui.btnGuardarEdicion.disabled = true;
        try {
            // La API actualiza metadatos; no reemplaza la imagen ni el vínculo de sesión.
            const cambios = {
                id: dibujo.id,
                title: ui.editarTitulo.value.trim(),
                description: ui.editarDescripcion.value,
                category: ui.editarCategoria.value,
                drawing_date: ui.editarFecha.value
            };
            await galeria.solicitarApi("update", {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: JSON.stringify(cambios)
            });

            Object.assign(dibujo, cambios);
            galeria.mostrarDetalle(dibujo);
            await galeria.cargar();
        } catch (error) {
            galeria.mostrarError(ui.mensajeEdicion, error);
        } finally {
            ui.btnGuardarEdicion.disabled = false;
        }
    });
})(window.Galeria);
