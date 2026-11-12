(function (galeria) {
    // El cliente pide confirmación; el servidor vuelve a validar propiedad y sesión.
    galeria.crearBotonEliminar = function (dibujo) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Eliminar";
        boton.setAttribute("aria-label", "Eliminar " + dibujo.title);
        boton.addEventListener("click", async function () {
            if (!confirm(
                '¿Eliminar "' + dibujo.title +
                '" de tu galería? Esta acción no se puede deshacer.'
            )) {
                return;
            }

            boton.disabled = true;
            boton.textContent = "Eliminando...";
            try {
                await galeria.solicitarApi("delete", {
                    method: "POST",
                    headers: { "X-CSRF-Token": galeria.tokenCsrf },
                    body: JSON.stringify({ id: dibujo.id })
                });
                if (await galeria.cargar()) {
                    galeria.ui.galeriaMensaje.textContent =
                        "El dibujo se eliminó de tu galería.";
                }
            } catch (error) {
                galeria.mostrarError(galeria.ui.galeriaMensaje, error);
                boton.disabled = false;
                boton.textContent = "Eliminar";
            }
        });
        return boton;
    };
})(window.Galeria);
