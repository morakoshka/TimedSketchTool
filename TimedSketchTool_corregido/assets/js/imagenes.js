/*
  Carga referencias locales y actualiza la imagen visible.
  Los archivos se conservan únicamente como URLs de objeto en este navegador.
*/
(function (practica) {
    const entrada = document.getElementById("referencias");
    const imagen = document.getElementById("imagenReferencia");
    const mensaje = document.getElementById("mensajeReferencia");
    const numeroActual = document.getElementById("imagenActual");
    const total = document.getElementById("totalImagenes");
    practica.mostrarImagen = function () {
        const lista = practica.sesionActiva
            ? practica.imagenesSesion
            : practica.referencias.map(function (referencia) {
                return referencia.url;
            });

        if (lista.length === 0) {
            imagen.hidden = true;
            imagen.removeAttribute("src");
            mensaje.hidden = false;
            numeroActual.textContent = "0";
            total.textContent = "0";
            practica.actualizarEstadoControles?.();
            return;
        }

        imagen.src = lista[practica.indiceActual];
        imagen.alt = practica.referencias.find(function (referencia) {
            return referencia.url === imagen.src;
        })?.nombre || "Imagen de referencia para dibujar";
        imagen.hidden = false;
        mensaje.hidden = true;
        numeroActual.textContent = String(practica.indiceActual + 1);
        total.textContent = String(lista.length);
        practica.actualizarEstadoControles?.();
    };

    entrada.addEventListener("change", function () {
        practica.referencias.forEach(function (referencia) {
            URL.revokeObjectURL(referencia.url);
        });
        if (practica.sesionActiva) {
            window.temporizadorPractica.detener();
        }
        practica.sesionActiva = false;
        practica.imagenesSesion = [];
        practica.indiceActual = 0;
        practica.ejerciciosCompletados = 0;
        practica.ejerciciosContabilizados.clear();
        practica.tiempoTotalSegundos = 0;
        practica.contextoSesionGaleria = null;
        practica.referencias = [];
        practica.categoriasPorImagen.clear();
        practica.limpiarControlesCategorias();

        const archivosValidos = Array.from(entrada.files || [])
            .filter(function (archivo) {
                return archivo.type.startsWith("image/");
            });

        archivosValidos.forEach(function (archivo, indice) {
            const url = URL.createObjectURL(archivo);
            practica.referencias.push({ url: url, nombre: archivo.name });
            practica.categoriasPorImagen.set(url, "sin_categoria");
            practica.agregarControlCategoria(archivo.name, url, indice);
        });

        practica.actualizarEstadoControles();
        practica.mostrarImagen();
        document.dispatchEvent(new CustomEvent("sesionGaleriaDisponible", {
            detail: null
        }));
    });

    practica.mostrarImagen();
})(window.TST);
