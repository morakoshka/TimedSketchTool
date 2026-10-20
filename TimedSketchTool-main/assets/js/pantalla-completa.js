/*
  Timed Sketch Tool
  Módulo de pantalla completa
  Muestra solo el área de práctica y mantiene visibles los controles.
*/
const btnPantallaCompleta = document.getElementById("btnPantallaCompleta");
const seccionPractica = document.getElementById("practica");

btnPantallaCompleta.addEventListener("click", async function () {
    if (!seccionPractica.requestFullscreen || !document.exitFullscreen) {
        alert("Este navegador no admite pantalla completa.");
        return;
    }

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await seccionPractica.requestFullscreen();
        }
    } catch (error) {
        console.error("No se pudo cambiar a pantalla completa:", error);
        alert("No se pudo activar la pantalla completa.");
    }
});

// El evento también se ejecuta al salir con la tecla Escape.
document.addEventListener("fullscreenchange", function () {
    const activa = document.fullscreenElement === seccionPractica;
    btnPantallaCompleta.textContent = activa
        ? "Salir de pantalla completa"
        : "Pantalla completa";
    btnPantallaCompleta.setAttribute("aria-pressed", String(activa));
});
