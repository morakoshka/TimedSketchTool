(function (galeria) {
    const ui = galeria.ui;

    // Se validan los metadatos antes de abrir el selector de archivos.
    ui.btnAgregarDibujo.addEventListener("click", function () {
        if (!ui.tituloDibujo.reportValidity() || !ui.fechaDibujo.reportValidity()) {
            return;
        }
        ui.archivoDibujo.click();
    });

    ui.archivoDibujo.addEventListener("change", async function () {
        const archivo = ui.archivoDibujo.files[0];
        if (!archivo) {
            return;
        }

        const datos = new FormData();
        datos.append("drawing", archivo);
        datos.append("title", ui.tituloDibujo.value.trim());
        datos.append("description", ui.descripcionDibujo.value.trim());
        datos.append("category", ui.categoriaDibujo.value);
        datos.append("drawing_date", ui.fechaDibujo.value);
        // La sesión se envía como instantánea para preservar el contexto del dibujo.
        if (ui.incluirSesion.checked && galeria.contextoSesion) {
            datos.append("session", JSON.stringify(galeria.contextoSesion));
        }
        ui.galeriaMensaje.textContent = "Guardando dibujo...";

        try {
            await galeria.solicitarApi("upload", {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: datos
            });
            ui.archivoDibujo.value = "";
            ui.tituloDibujo.value = "";
            ui.descripcionDibujo.value = "";
            ui.fechaDibujo.value = galeria.fechaLocalActual();
            ui.incluirSesion.checked = false;
            await galeria.cargar();
        } catch (error) {
            galeria.mostrarError(ui.galeriaMensaje, error);
        }
    });
})(window.Galeria);
