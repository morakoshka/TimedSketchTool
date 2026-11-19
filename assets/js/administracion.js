(function (galeria) {
    const ui = {
        mensaje: document.getElementById("admin-mensaje"),
        listaCategorias: document.getElementById("admin-lista-categorias"),
        listaContenido: document.getElementById("admin-lista-contenido"),
        listaUsuarios: document.getElementById("admin-lista-usuarios"),
        formularioCategoria: document.getElementById("form-admin-categoria"),
        nombreCategoria: document.getElementById("admin-categoria-nombre"),
        formularioAjustes: document.getElementById("form-admin-ajustes"),
        titulo: document.getElementById("admin-titulo"),
        bienvenida: document.getElementById("admin-bienvenida"),
        duracion: document.getElementById("admin-duracion"),
        dialogoImagen: document.getElementById("admin-imagen-dialog"),
        tituloImagen: document.getElementById("admin-imagen-titulo"),
        imagen: document.getElementById("admin-imagen")
    };

    function crearBoton(texto, accion) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = texto;
        boton.addEventListener("click", accion);
        return boton;
    }

    function crearFila(texto, acciones) {
        const fila = document.createElement("div");
        fila.className = "admin-row";
        const detalle = document.createElement("span");
        detalle.textContent = texto;
        fila.appendChild(detalle);
        acciones.forEach(function (accion) {
            fila.appendChild(accion);
        });
        return fila;
    }

    async function ejecutar(accion, opciones) {
        return galeria.solicitarApi(accion, {
            ...opciones,
            headers: {
                "X-CSRF-Token": galeria.tokenCsrf,
                ...(opciones && opciones.headers ? opciones.headers : {})
            }
        });
    }

    function enviarJson(accion, datos) {
        return ejecutar(accion, {
            method: "POST",
            body: JSON.stringify(datos)
        });
    }

    function mostrarError(error) {
        galeria.mostrarError(ui.mensaje, error);
    }

    function crearSlug(etiqueta) {
        return etiqueta.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 24);
    }

    async function cargarCategorias() {
        const respuesta = await galeria.solicitarApi("admin-categories");
        galeria.actualizarCategorias(respuesta.categories);
        ui.listaCategorias.replaceChildren();
        respuesta.categories.forEach(function (categoria) {
            const acciones = [
                crearBoton("Cambiar nombre", async function () {
                    const nombre = prompt("Nuevo nombre de categoría:", categoria.label);
                    if (nombre === null || !nombre.trim()) {
                        return;
                    }
                    try {
                        await enviarJson("admin-category-update", {
                            slug: categoria.slug,
                            label: nombre.trim()
                        });
                        await cargarCategorias();
                        ui.mensaje.textContent = "Categoría actualizada.";
                    } catch (error) {
                        mostrarError(error);
                    }
                })
            ];
            if (!Number(categoria.is_system)) {
                acciones.push(crearBoton("Eliminar", async function () {
                    if (!confirm(
                        '¿Eliminar la categoría "' + categoria.label +
                        '"? Solo se puede eliminar si ningún dibujo la utiliza.'
                    )) {
                        return;
                    }
                    try {
                        await enviarJson("admin-category-delete", {
                            slug: categoria.slug
                        });
                        await cargarCategorias();
                        ui.mensaje.textContent = "Categoría eliminada.";
                    } catch (error) {
                        mostrarError(error);
                    }
                }));
            }
            ui.listaCategorias.appendChild(
                crearFila(categoria.label + " (" + categoria.slug + ")", acciones)
            );
        });
    }

    async function cargarContenido() {
        const respuesta = await galeria.solicitarApi("admin-drawings");
        ui.listaContenido.replaceChildren();
        if (respuesta.drawings.length === 0) {
            ui.listaContenido.textContent = "No hay dibujos guardados.";
            return;
        }
        respuesta.drawings.forEach(function (dibujo) {
            const detalle = dibujo.title + " — " + dibujo.email + " — " +
                galeria.etiquetaCategoria(dibujo.category) + " — " +
                galeria.formatearFecha(dibujo.drawing_date);
            ui.listaContenido.appendChild(crearFila(detalle, [
                crearBoton("Ver dibujo", function () {
                    ui.tituloImagen.textContent = dibujo.title + " — " + dibujo.email;
                    ui.imagen.src = "api.php?action=admin-image&id=" +
                        encodeURIComponent(dibujo.id);
                    ui.dialogoImagen.showModal();
                }),
                crearBoton("Eliminar", async function () {
                    if (!confirm(
                        '¿Eliminar "' + dibujo.title + '" de ' + dibujo.email +
                        '? Esta acción no se puede deshacer.'
                    )) {
                        return;
                    }
                    try {
                        await enviarJson("admin-drawing-delete", { id: dibujo.id });
                        await cargarContenido();
                        await galeria.cargar();
                        ui.mensaje.textContent = "Dibujo eliminado.";
                    } catch (error) {
                        mostrarError(error);
                    }
                })
            ]));
        });
    }

    async function cargarUsuarios() {
        const respuesta = await galeria.solicitarApi("admin-users");
        ui.listaUsuarios.replaceChildren();
        respuesta.users.forEach(function (usuario) {
            const esAdmin = Boolean(Number(usuario.is_admin));
            const detalle = usuario.email + " — " +
                (esAdmin ? "Administrador" : "Usuario") + " — " +
                usuario.drawing_count + " dibujos";
            const boton = crearBoton(
                esAdmin ? "Quitar administrador" : "Hacer administrador",
                async function () {
                    try {
                        await enviarJson("admin-user-role", {
                            user_id: Number(usuario.id),
                            is_admin: !esAdmin
                        });
                        await cargarUsuarios();
                        ui.mensaje.textContent = "Permisos actualizados.";
                    } catch (error) {
                        mostrarError(error);
                    }
                }
            );
            boton.disabled = Number(usuario.id) === galeria.usuario.id && esAdmin;
            ui.listaUsuarios.appendChild(crearFila(detalle, [boton]));
        });
    }

    function mostrarAjustes(configuracion) {
        ui.titulo.value = configuracion.app_title;
        ui.bienvenida.value = configuracion.welcome_message;
        ui.duracion.value = String(configuracion.default_duration_seconds);
    }

    async function cargarPanel() {
        ui.mensaje.textContent = "";
        try {
            await cargarCategorias();
            await Promise.all([
                cargarContenido(),
                cargarUsuarios()
            ]);
            const respuesta = await galeria.solicitarApi("admin-settings");
            mostrarAjustes(respuesta.settings);
        } catch (error) {
            mostrarError(error);
        }
    }

    ui.formularioCategoria.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const label = ui.nombreCategoria.value.trim();
        const slug = crearSlug(label);
        if (!slug) {
            ui.mensaje.textContent = "Escribe un nombre de categoría válido.";
            return;
        }
        try {
            await enviarJson("admin-category-create", { slug: slug, label: label });
            ui.formularioCategoria.reset();
            await cargarCategorias();
            ui.mensaje.textContent = "Categoría creada.";
        } catch (error) {
            mostrarError(error);
        }
    });

    ui.formularioAjustes.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        try {
            const respuesta = await enviarJson("admin-settings-update", {
                app_title: ui.titulo.value,
                welcome_message: ui.bienvenida.value,
                default_duration_seconds: Number(ui.duracion.value)
            });
            galeria.aplicarConfiguracion(respuesta.settings);
            mostrarAjustes(respuesta.settings);
            ui.mensaje.textContent = respuesta.message;
        } catch (error) {
            mostrarError(error);
        }
    });

    document.getElementById("admin-cerrar-imagen").addEventListener("click", function () {
        ui.dialogoImagen.close();
        ui.imagen.removeAttribute("src");
    });

    ui.dialogoImagen.addEventListener("close", function () {
        ui.imagen.removeAttribute("src");
    });

    document.addEventListener("cuentaActualizada", function (evento) {
        if (evento.detail && evento.detail.is_admin) {
            cargarPanel();
        } else {
            ui.mensaje.textContent = "";
        }
    });
})(window.Galeria);
