(function (galeria) {
    document.getElementById("form-registro").addEventListener(
        "submit",
        function (evento) {
            galeria.enviarCredenciales(evento, "register");
        }
    );
})(window.Galeria);
