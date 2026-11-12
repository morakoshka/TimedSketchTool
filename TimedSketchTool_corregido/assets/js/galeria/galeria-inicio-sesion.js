(function (galeria) {
    document.getElementById("form-inicio-sesion").addEventListener(
        "submit",
        function (evento) {
            galeria.enviarCredenciales(evento, "login");
        }
    );
})(window.Galeria);
