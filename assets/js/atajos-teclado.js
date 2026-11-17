(function (practica) {
    document.addEventListener("keydown", function (evento) {
        if (!practica.sesionActiva || evento.repeat || evento.altKey ||
            evento.ctrlKey || evento.metaKey) {
            return;
        }
        const elemento = evento.target;
        if (elemento instanceof HTMLElement &&
            (elemento.isContentEditable ||
                ["INPUT", "SELECT", "TEXTAREA"].includes(elemento.tagName) ||
                (elemento.tagName === "BUTTON" && evento.code === "Space") ||
                elemento.closest("dialog[open]"))) {
            return;
        }

        if (evento.code === "Space") {
            evento.preventDefault();
            window.temporizadorPractica.alternarPausa();
        } else if (evento.key === "ArrowRight") {
            evento.preventDefault();
            practica.cambiarImagen(1, false);
        } else if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            practica.cambiarImagen(-1, false);
        }
    });
})(window.TST);
