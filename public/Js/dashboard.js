const logoutButton =
    document.getElementById("logoutButton");


// ==========================================
// CERRAR SESIÓN
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            const confirmar =
                confirm(
                    "¿Está seguro de que desea cerrar sesión?"
                );

            if (!confirmar) {
                return;
            }

            // ==========================================
            // LIMPIAR SESIÓN TEMPORAL
            // ==========================================

            sessionStorage.clear();

            // ==========================================
            // VOLVER AL LOGIN
            // ==========================================

            window.location.href =
                "../index.html";
        }
    );
}