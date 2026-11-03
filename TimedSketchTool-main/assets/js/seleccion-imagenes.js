(function (practica) {
    function mezclar(lista) {
        const resultado = [...lista];
        for (let indice = resultado.length - 1; indice > 0; indice--) {
            const otroIndice = Math.floor(Math.random() * (indice + 1));
            [resultado[indice], resultado[otroIndice]] =
                [resultado[otroIndice], resultado[indice]];
        }
        return resultado;
    }

    practica.seleccionarImagenes = function (configuracion) {
        let disponibles = practica.referencias.filter(function (referencia) {
            return configuracion.categoria === "todas" ||
                practica.categoriasPorImagen.get(referencia.url) ===
                    configuracion.categoria;
        });

        if (disponibles.length === 0) {
            throw new Error("No hay imágenes disponibles en la categoría seleccionada.");
        }
        if (configuracion.aleatorio) {
            disponibles = mezclar(disponibles);
        }
        return disponibles.slice(0, configuracion.cantidad)
            .map(function (referencia) {
                return referencia.url;
            });
    };
})(window.TST);
