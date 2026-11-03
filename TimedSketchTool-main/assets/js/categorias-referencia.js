(function (practica) {
    const contenedor = document.createElement("div");
    contenedor.id = "contenedorCategorias";
    contenedor.hidden = true;
    document.getElementById("referencias").insertAdjacentElement(
        "afterend",
        contenedor
    );

    practica.categorias = [
        { slug: "sin_categoria", label: "Sin categoría" },
        { slug: "poses", label: "Poses" },
        { slug: "rostros", label: "Rostros" },
        { slug: "manos", label: "Manos" },
        { slug: "anatomia", label: "Anatomía" }
    ];

    practica.agregarControlCategoria = function (nombre, url, indice) {
        if (contenedor.childElementCount === 0) {
            const titulo = document.createElement("h3");
            titulo.textContent = "Categorías de las imágenes";
            contenedor.appendChild(titulo);
            const ayuda = document.createElement("p");
            ayuda.textContent = "Asigna una categoría a cada referencia.";
            contenedor.appendChild(ayuda);
        }

        const fila = document.createElement("div");
        fila.className = "fila-categoria";
        const etiqueta = document.createElement("label");
        etiqueta.htmlFor = "categoriaImagen" + indice;
        etiqueta.textContent = nombre;

        const selector = document.createElement("select");
        selector.id = etiqueta.htmlFor;
        selector.dataset.referenceUrl = url;
        practica.categorias.forEach(function (categoria) {
            const opcion = document.createElement("option");
            opcion.value = categoria.slug;
            opcion.textContent = categoria.label;
            selector.appendChild(opcion);
        });
        selector.addEventListener("change", function () {
            practica.categoriasPorImagen.set(url, selector.value);
        });

        fila.append(etiqueta, selector);
        contenedor.appendChild(fila);
        contenedor.hidden = false;
    };

    practica.limpiarControlesCategorias = function () {
        contenedor.replaceChildren();
        contenedor.hidden = true;
    };

    window.actualizarCategoriasDisponibles = function (categorias) {
        practica.categorias = categorias;
        contenedor.querySelectorAll("select").forEach(function (selector) {
            const categoriaAnterior = selector.value;
            selector.replaceChildren();
            categorias.forEach(function (categoria) {
                const opcion = document.createElement("option");
                opcion.value = categoria.slug;
                opcion.textContent = categoria.label;
                selector.appendChild(opcion);
            });
            const categoriaValida = categorias.some(function (categoria) {
                return categoria.slug === categoriaAnterior;
            });
            selector.value = categoriaValida ? categoriaAnterior : "sin_categoria";
            practica.categoriasPorImagen.set(
                selector.dataset.referenceUrl,
                selector.value
            );
        });
    };
})(window.TST);
