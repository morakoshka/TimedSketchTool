window.TST = {
    referencias: [],
    imagenesSesion: [],
    categoriasPorImagen: new Map(),
    indiceActual: 0,
    sesionActiva: false,
    contextoSesionGaleria: null,
    ejerciciosCompletados: 0,
    // Cada posición de la sesión cuenta una sola vez, aunque se vuelva atrás.
    ejerciciosContabilizados: new Set(),
    tiempoTotalSegundos: 0,
    seleccion: null
};
