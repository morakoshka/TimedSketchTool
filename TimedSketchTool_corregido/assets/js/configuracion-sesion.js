(function (practica) {
    const selectorDuracion = document.getElementById("duracion");
    const selectorCategoria = document.getElementById("categoria-referencia");
    const selectorCantidad = document.getElementById("cantidad");
    const aleatorio = document.getElementById("aleatorio");

    practica.obtenerConfiguracion = function () {
        const esModoLibre = selectorDuracion.value === "libre";
        const duracion = esModoLibre ? null : Number(selectorDuracion.value);
        const cantidad = Number(selectorCantidad.value);

        if (!esModoLibre && ![30, 60, 120, 300].includes(duracion)) {
            throw new Error("Selecciona una duración válida.");
        }
        if (!Number.isInteger(cantidad) || cantidad < 1) {
            throw new Error("Selecciona una cantidad válida.");
        }

        return {
            duracionSegundos: duracion,
            modoLibre: esModoLibre,
            categoria: selectorCategoria.value,
            cantidad: cantidad,
            aleatorio: aleatorio.checked
        };
    };
})(window.TST);
