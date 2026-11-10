
// ==========================================
// CONFIGURACIÓN DEL LOGIN
// ==========================================

const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO = 30; // Segundos

const CLAVE_INTENTOS = "intentos";
const CLAVE_BLOQUEO = "bloqueoHasta";

// Credenciales de demostración
const USUARIO_DEMO = "1013456@antoniolorena.com";
const PASSWORD_DEMO = "1013456_Jorge";

// Elementos del formulario
const form = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");

const loginMessage = document.getElementById("loginMessage");
const lockoutMessage = document.getElementById("lockoutMessage");
const countdown = document.getElementById("countdown");
const attemptCounter = document.getElementById("attemptCounter");

const usuarioError = document.getElementById("usuarioError");
const passwordError = document.getElementById("passwordError");

const togglePassword = document.getElementById("togglePassword");
const forgotPassword = document.getElementById("forgotPassword");

// Elementos opcionales de la interfaz
const usuarioContainer = document.getElementById("usuarioContainer");
const passwordContainer = document.getElementById("passwordContainer");
const toggleIcon = document.getElementById("toggleIcon");

// Estado del sistema
let intentos = Number(sessionStorage.getItem(CLAVE_INTENTOS)) || 0;
let bloqueoHasta = Number(sessionStorage.getItem(CLAVE_BLOQUEO)) || 0;
let intervaloBloqueo = null;


// ==========================================
// ACTUALIZAR CONTADOR DE INTENTOS
// ==========================================

function actualizarIntentos() {
    if (attemptCounter) {
        attemptCounter.textContent =
            `Intentos fallidos: ${intentos} de ${MAX_INTENTOS}`;
    }
}


// ==========================================
// MENSAJES
// ==========================================

function mostrarMensaje(mensaje, tipo = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = mensaje;
    loginMessage.className = `login-message ${tipo}`;
    loginMessage.style.display = "flex";
}

function limpiarMensajes() {
    if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className = "login-message";
        loginMessage.style.display = "none";
    }

    if (usuarioError) usuarioError.textContent = "";
    if (passwordError) passwordError.textContent = "";

    usuarioContainer?.classList.remove("error");
    passwordContainer?.classList.remove("error");
}

function mostrarErrorCampo(input, contenedor, elementoError, mensaje) {
    if (contenedor) contenedor.classList.add("error");
    if (elementoError) elementoError.textContent = mensaje;
}

function limpiarErrorCampo(contenedor, elementoError) {
    if (contenedor) contenedor.classList.remove("error");
    if (elementoError) elementoError.textContent = "";
}


// ==========================================
// VALIDAR CAMPOS OBLIGATORIOS
// ==========================================

function validarCampos(usuario, password) {
    let valido = true;

    if (!usuario) {
        mostrarErrorCampo(
            usuarioInput,
            usuarioContainer,
            usuarioError,
            "Ingrese su nombre de usuario."
        );

        valido = false;
    }

    if (!password) {
        mostrarErrorCampo(
            passwordInput,
            passwordContainer,
            passwordError,
            "Ingrese su contraseña."
        );

        valido = false;
    }

    return valido;
}


// ==========================================
// AUTENTICACIÓN DE DEMOSTRACIÓN
// ==========================================

function autenticarUsuario(usuario, password) {
    const usuarioLimpio = usuario.trim().toLowerCase();
    const usuarioRegistrado = USUARIO_DEMO.toLowerCase();

    if (
        usuarioLimpio === usuarioRegistrado &&
        password === PASSWORD_DEMO
    ) {
        return {
            autenticado: true,
            mensaje: "Credenciales correctas."
        };
    }

    return {
        autenticado: false,
        mensaje: "Credenciales incorrectas."
    };
}


// ==========================================
// REGISTRAR INTENTO FALLIDO
// ==========================================

function registrarIntentoFallido() {
    intentos++;

    sessionStorage.setItem(CLAVE_INTENTOS, intentos);

    actualizarIntentos();

    if (intentos >= MAX_INTENTOS) {
        iniciarBloqueo();
    } else {
        const restantes = MAX_INTENTOS - intentos;

        mostrarMensaje(
            `Credenciales incorrectas. Le quedan ${restantes} intento(s).`,
            "error"
        );
    }
}


// ==========================================
// INICIAR BLOQUEO TEMPORAL
// ==========================================

function iniciarBloqueo() {
    bloqueoHasta = Date.now() + (TIEMPO_BLOQUEO * 1000);

    sessionStorage.setItem(CLAVE_BLOQUEO, bloqueoHasta);

    actualizarBloqueo();
}


// ==========================================
// ACTUALIZAR CUENTA REGRESIVA
// ==========================================

function actualizarBloqueo() {
    clearInterval(intervaloBloqueo);

    function verificarTiempo() {
        const restante = Math.max(
            0,
            Math.ceil((bloqueoHasta - Date.now()) / 1000)
        );

        if (restante > 0) {
            btnLogin.disabled = true;
            usuarioInput.disabled = true;
            passwordInput.disabled = true;

            if (lockoutMessage) {
                lockoutMessage.hidden = false;
            }

            if (countdown) {
                countdown.textContent = restante;
            }

            mostrarMensaje(
                "Se alcanzó el límite de intentos permitidos.",
                "error"
            );

        } else {
            finalizarBloqueo();
        }
    }

    verificarTiempo();

    if (Date.now() < bloqueoHasta) {
        intervaloBloqueo = setInterval(verificarTiempo, 1000);
    }
}


// ==========================================
// FINALIZAR BLOQUEO
// ==========================================

function finalizarBloqueo(mostrarAviso = true) {
    clearInterval(intervaloBloqueo);

    intentos = 0;
    bloqueoHasta = 0;

    sessionStorage.removeItem(CLAVE_INTENTOS);
    sessionStorage.removeItem(CLAVE_BLOQUEO);

    btnLogin.disabled = false;
    usuarioInput.disabled = false;
    passwordInput.disabled = false;

    if (lockoutMessage) {
        lockoutMessage.hidden = true;
    }

    actualizarIntentos();

    if (mostrarAviso) {
        mostrarMensaje(
            "El bloqueo ha finalizado. Puede intentar nuevamente.",
            "success"
        );
    }
}


// ==========================================
// ENVIAR FORMULARIO
// ==========================================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    // Comprobar si existe un bloqueo activo
    if (Date.now() < bloqueoHasta) {
        actualizarBloqueo();
        return;
    }

    limpiarMensajes();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;

    // Validar campos vacíos
    if (!validarCampos(usuario, password)) {
        return;
    }

    // Deshabilitar botón mientras se valida
    btnLogin.disabled = true;

    const textoBoton = btnLogin.querySelector("span");

    if (textoBoton) {
        textoBoton.textContent = "Verificando...";
    }

    try {
        const resultado = autenticarUsuario(usuario, password);

        if (resultado.autenticado) {

            // Reiniciar intentos después del acceso exitoso
            intentos = 0;
            bloqueoHasta = 0;

            sessionStorage.removeItem(CLAVE_INTENTOS);
            sessionStorage.removeItem(CLAVE_BLOQUEO);

            actualizarIntentos();

            mostrarMensaje(
                "Bienvenido. Inicio de sesión exitoso.",
                "success"
            );

            // Evitar nuevos envíos después del acceso
            usuarioInput.disabled = true;
            passwordInput.disabled = true;
            btnLogin.disabled = true;

            if (textoBoton) {
                textoBoton.textContent = "Acceso concedido";
            }

            // Cuando tengas listo el dashboard, puedes activar:
            // window.location.href = "Pages/dashboard.html";

        } else {

            registrarIntentoFallido();

            // Si todavía no se alcanzó el límite, permitir otro intento
            if (intentos < MAX_INTENTOS) {
                btnLogin.disabled = false;

                if (textoBoton) {
                    textoBoton.textContent = "Iniciar sesión";
                }
            }
        }

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);

        mostrarMensaje(
            "Ocurrió un error. Intente nuevamente.",
            "error"
        );

        btnLogin.disabled = false;

        if (textoBoton) {
            textoBoton.textContent = "Iniciar sesión";
        }
    }
});


// ==========================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ==========================================

if (togglePassword) {
    togglePassword.addEventListener("click", function(event) {
        event.preventDefault();

        const visible = passwordInput.type === "password";

        passwordInput.type = visible ? "text" : "password";

        if (toggleIcon) {
            toggleIcon.name = visible ? "eye-off-outline" : "eye-outline";
        } else {
            togglePassword.innerHTML = visible
                ? '<ion-icon name="eye-off-outline"></ion-icon>'
                : '<ion-icon name="eye-outline"></ion-icon>';
        }

        togglePassword.setAttribute(
            "aria-label",
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
        );
    });
}


// ==========================================
// LIMPIAR ERRORES AL ESCRIBIR
// ==========================================

usuarioInput.addEventListener("input", function() {
    limpiarErrorCampo(usuarioContainer, usuarioError);
});

passwordInput.addEventListener("input", function() {
    limpiarErrorCampo(passwordContainer, passwordError);
});


// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================

if (forgotPassword) {
    forgotPassword.addEventListener("click", function(event) {
        event.preventDefault();

        alert(
            "Para recuperar su contraseña, comuníquese con el administrador del sistema."
        );
    });
}


// ==========================================
// INICIALIZACIÓN
// ==========================================

actualizarIntentos();

// Si existe un bloqueo vigente, continuar la cuenta regresiva.
// Si el bloqueo expiró mientras la página estaba cerrada,
// reiniciar los intentos.
// Si no hubo bloqueo, conservar los intentos anteriores.

if (bloqueoHasta > 0) {
    if (Date.now() < bloqueoHasta) {
        actualizarBloqueo();
    } else {
        finalizarBloqueo(false);
    }
} else {
    btnLogin.disabled = false;
    usuarioInput.disabled = false;
    passwordInput.disabled = false;
}
