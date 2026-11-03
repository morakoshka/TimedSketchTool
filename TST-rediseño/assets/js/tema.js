/* Timed Sketch Tool: selector de tema claro / oscuro. */
const btnTema = document.getElementById("btnTema");

function leerTemaGuardado() {
    try {
        return localStorage.getItem("timed-sketch-theme");
    } catch (error) {
        return null;
    }
}

function guardarTema(tema) {
    try {
        localStorage.setItem("timed-sketch-theme", tema);
    } catch (error) {
        // El tema funciona incluso sin acceso a localStorage.
    }
}

function aplicarTema(tema) {
    const oscuro = tema === "dark";
    document.documentElement.dataset.theme = oscuro ? "dark" : "light";
    btnTema.textContent = oscuro ? "Modo claro" : "Modo oscuro";
    btnTema.setAttribute("aria-pressed", String(oscuro));
}

aplicarTema(leerTemaGuardado() === "dark" ? "dark" : "light");

btnTema.addEventListener("click", function () {
    const siguiente = document.documentElement.dataset.theme === "dark"
        ? "light"
        : "dark";
    const reducirMovimiento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducirMovimiento && typeof document.startViewTransition === "function") {
        document.startViewTransition(() => aplicarTema(siguiente));
    } else {
        aplicarTema(siguiente);
    }
    guardarTema(siguiente);
});
