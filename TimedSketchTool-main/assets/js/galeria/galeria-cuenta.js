(function (galeria) {
    const ui = galeria.ui;

    // Cambiar de cuenta invalida las cargas pendientes y evita mostrar datos anteriores.
    function actualizarEstadoCuenta(usuario) {
        galeria.usuario = usuario;
        ui.cuentaForms.hidden = Boolean(usuario);
        ui.cuentaActiva.hidden = !usuario;
        ui.controlesGaleria.hidden = !usuario;
        ui.btnAgregarDibujo.hidden = !usuario;
        ui.galeriaUsuario.hidden = !usuario;

        if (usuario) {
            ui.cuentaCorreo.textContent = usuario.email;
            ui.galeriaUsuario.textContent =
                "Dibujos guardados por " + usuario.email;
            ui.galeriaMensaje.textContent = "";
            galeria.cargar();
        } else {
            galeria.solicitud++;
            ui.cuentaCorreo.textContent = "";
            ui.galeriaUsuario.textContent = "";
            ui.galeriaMensaje.textContent =
                "Inicia sesión para consultar y guardar tus dibujos.";
            ui.listaGaleria.replaceChildren();
        }
    }

    async function enviarCredenciales(evento, accion) {
        evento.preventDefault();
        ui.cuentaMensaje.textContent = "";
        const formulario = evento.currentTarget;
        const datosFormulario = new FormData(formulario);

        try {
            const respuesta = await galeria.solicitarApi(accion, {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: JSON.stringify({
                    email: datosFormulario.get("email"),
                    password: datosFormulario.get("password")
                })
            });
            galeria.tokenCsrf = respuesta.csrfToken;
            formulario.reset();
            ui.cuentaMensaje.textContent = accion === "register"
                ? "Cuenta creada correctamente."
                : "Sesión iniciada.";
            actualizarEstadoCuenta(respuesta.user);
        } catch (error) {
            galeria.mostrarError(ui.cuentaMensaje, error);
        }
    }

    document.getElementById("form-registro").addEventListener("submit", function (evento) {
        enviarCredenciales(evento, "register");
    });
    document.getElementById("form-inicio-sesion").addEventListener("submit", function (evento) {
        enviarCredenciales(evento, "login");
    });

    ui.btnCerrarSesion.addEventListener("click", async function () {
        ui.cuentaMensaje.textContent = "";
        try {
            const respuesta = await galeria.solicitarApi("logout", {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: JSON.stringify({})
            });
            galeria.tokenCsrf = respuesta.csrfToken;
            actualizarEstadoCuenta(null);
            ui.cuentaMensaje.textContent = "Sesión cerrada.";
        } catch (error) {
            galeria.mostrarError(ui.cuentaMensaje, error);
        }
    });

    // Obtener sesión y token CSRF antes de permitir cambios autenticados.
    galeria.solicitarApi("session")
        .then(function (respuesta) {
            galeria.tokenCsrf = respuesta.csrfToken;
            actualizarEstadoCuenta(respuesta.user);
        })
        .catch(function (error) {
            ui.cuentaForms.hidden = true;
            ui.galeriaMensaje.textContent =
                "No se pudo conectar con el servidor de cuentas. " + error.message;
            ui.cuentaMensaje.textContent =
                "Abre la aplicación desde Apache (por ejemplo, http://localhost/TimedSketchTool).";
        });
})(window.Galeria);
