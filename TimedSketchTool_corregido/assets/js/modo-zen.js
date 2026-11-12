(function () {
    const boton = document.getElementById("btnModoZen");
    const practica = document.getElementById("practica");

    boton.addEventListener("click", function () {
        const activo = document.body.classList.toggle("zen-mode");
        boton.textContent = activo ? "Salir del modo Zen" : "Modo Zen";
        boton.setAttribute("aria-pressed", String(activo));
        if (activo) {
            practica.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    document.addEventListener("sesionIniciada", function () {
        boton.hidden = false;
    });
    document.addEventListener("sesionFinalizada", function () {
        document.body.classList.remove("zen-mode");
        boton.textContent = "Modo Zen";
        boton.setAttribute("aria-pressed", "false");
        boton.hidden = true;
    });
})();
