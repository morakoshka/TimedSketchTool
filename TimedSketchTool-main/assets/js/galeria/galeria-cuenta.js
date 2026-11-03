(function (galeria) {
    const ui = galeria.ui;

    galeria.actualizarEstadoCuenta = function (usuario, datosIniciales) {
        galeria.usuario = usuario;
        ui.cuentaForms.hidden = Boolean(usuario);
        ui.cuentaActiva.hidden = !usuario;
        ui.controlesGaleria.hidden = !usuario;
        ui.btnAgregarDibujo.hidden = !usuario;
        ui.galeriaUsuario.hidden = !usuario;
        ui.enlaceAdmin.hidden = !usuario || !usuario.is_admin;
        ui.panelAdmin.hidden = !usuario || !usuario.is_admin;

        if (Array.isArray(datosIniciales.categories)) {
            galeria.actualizarCategorias(datosIniciales.categories);
        }
        if (datosIniciales.settings) {
            galeria.aplicarConfiguracion(datosIniciales.settings);
        }
        document.dispatchEvent(new CustomEvent("cuentaActualizada", {
            detail: usuario
        }));

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
    };

    galeria.enviarCredenciales = async function (evento, accion) {
        evento.preventDefault();
        ui.cuentaMensaje.textContent = "";
        const formulario = evento.currentTarget;
        if (!formulario.reportValidity()) {
            return;
        }
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
            galeria.actualizarEstadoCuenta(respuesta.user, respuesta);
        } catch (error) {
            galeria.mostrarError(ui.cuentaMensaje, error);
        }
    };

    galeria.cerrarSesion = async function () {
        ui.cuentaMensaje.textContent = "";
        try {
            const respuesta = await galeria.solicitarApi("logout", {
                method: "POST",
                headers: { "X-CSRF-Token": galeria.tokenCsrf },
                body: JSON.stringify({})
            });
            galeria.tokenCsrf = respuesta.csrfToken;
            galeria.actualizarEstadoCuenta(null, respuesta);
            ui.cuentaMensaje.textContent = "Sesión cerrada.";
        } catch (error) {
            galeria.mostrarError(ui.cuentaMensaje, error);
        }
    };

    galeria.solicitarApi("session")
        .then(function (respuesta) {
            galeria.tokenCsrf = respuesta.csrfToken;
            galeria.actualizarEstadoCuenta(respuesta.user, respuesta);
        })
        .catch(function (error) {
            ui.cuentaForms.hidden = true;
            ui.galeriaMensaje.textContent =
                "No se pudo conectar con el servidor de cuentas. " + error.message;
            ui.cuentaMensaje.textContent =
                "Abre la aplicación desde Apache (por ejemplo, http://localhost/TimedSketchTool).";
        });
})(window.Galeria);
