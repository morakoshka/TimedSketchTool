(function (galeria) {
    const ui = galeria.ui;
    const vistaPrevia = document.getElementById("imagen-previa-dibujo");
    const placeholder = document.getElementById("vista-previa-vacia");
    const mensajeGuardado = document.getElementById("mensaje-guardado");
    let urlPrevia = null;
    let guardando = false;

    function limpiarPrevia() {
        if (urlPrevia) {
            URL.revokeObjectURL(urlPrevia);
            urlPrevia = null;
        }
        vistaPrevia.removeAttribute("src");
        vistaPrevia.hidden = true;
        placeholder.hidden = false;
    }

    // Elegir un archivo muestra su vista previa; no lo envía al servidor.
    ui.archivoDibujo.addEventListener("change", function () {
        limpiarPrevia();
        mensajeGuardado.textContent = "";
        const archivo = ui.archivoDibujo.files[0];
        if (!archivo) return;
        if (!/^image\/(jpeg|png|gif|webp)$/.test(archivo.type)) {
            mensajeGuardado.textContent = "Selecciona una imagen JPG, PNG, GIF o WebP.";
            ui.archivoDibujo.value = "";
            return;
        }
        urlPrevia = URL.createObjectURL(archivo);
        vistaPrevia.src = urlPrevia;
        vistaPrevia.hidden = false;
        placeholder.hidden = true;
    });

    // Al cambiar de cuenta, no conservar el archivo o los metadatos del usuario anterior.
    document.addEventListener("cuentaActualizada", function () {
        ui.archivoDibujo.value = "";
        limpiarPrevia();
        ui.tituloDibujo.value = "";
        ui.descripcionDibujo.value = "";
        ui.fechaDibujo.value = galeria.fechaLocalActual();
        ui.incluirSesion.checked = false;
        mensajeGuardado.textContent = "";
    });

    ui.btnAgregarDibujo.addEventListener("click", async function () {
        if (guardando) return;
        mensajeGuardado.textContent = "";

        if (!ui.tituloDibujo.reportValidity() || !ui.fechaDibujo.reportValidity()) {
            return;
        }
        if (!ui.archivoDibujo.reportValidity()) {
            mensajeGuardado.textContent = "Selecciona la imagen del dibujo antes de guardarlo.";
            return;
        }
        const archivo = ui.archivoDibujo.files[0];
        if (!archivo) return;

        const datos = new FormData();
        datos.append("drawing", archivo);
        datos.append("title", ui.tituloDibujo.value.trim());
        datos.append("description", ui.descripcionDibujo.value.trim());
        datos.append("category", ui.categoriaDibujo.value);
        datos.append("drawing_date", ui.fechaDibujo.value);
        if (ui.incluirSesion.checked && galeria.contextoSesion) {
            datos.append("session", JSON.stringify(galeria.contextoSesion));
        }

        guardando = true;
        ui.btnAgregarDibujo.disabled = true;
        ui.btnAgregarDibujo.textContent = "Guardando...";
        mensajeGuardado.textContent = "Guardando el dibujo en tu galería...";

        try {
            await galeria.solicitarApi("upload", {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: datos
            });
            ui.archivoDibujo.value = "";
            limpiarPrevia();
            ui.tituloDibujo.value = "";
            ui.descripcionDibujo.value = "";
            ui.fechaDibujo.value = galeria.fechaLocalActual();
            ui.incluirSesion.checked = false;
            mensajeGuardado.textContent = "Dibujo guardado correctamente. Ya aparece en tu colección.";
            await galeria.cargar();
        } catch (error) {
            galeria.mostrarError(mensajeGuardado, error);
        } finally {
            guardando = false;
            ui.btnAgregarDibujo.disabled = false;
            ui.btnAgregarDibujo.textContent = "Guardar dibujo";
        }
    });
})(window.Galeria);
