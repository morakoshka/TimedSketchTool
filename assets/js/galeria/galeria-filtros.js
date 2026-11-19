(function (galeria) {
    const ui = galeria.ui;

    // Todos los controles usan la misma consulta para combinar categoría y rango de fechas.
    ui.filtroGaleria.addEventListener("change", galeria.cargar);
    ui.fechaDesde.addEventListener("change", galeria.cargar);
    ui.fechaHasta.addEventListener("change", galeria.cargar);

    ui.btnLimpiarFiltros.addEventListener("click", function () {
        ui.filtroGaleria.value = "todas";
        ui.fechaDesde.value = "";
        ui.fechaHasta.value = "";
        galeria.cargar();
    });
})(window.Galeria);
