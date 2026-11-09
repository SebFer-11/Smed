
// ==========================================
// CONFIGURACIÓN
// ==========================================

const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO = 30; // Segundos
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
const loginForm = document.getElementById('loginForm');
const usuarioContainer = document.getElementById('usuarioContainer');
const passwordContainer = document.getElementById('passwordContainer');
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('toggleIcon');
const countdownSpan = document.getElementById('countdown');
const attemptCounterText = document.getElementById('attemptCounter');
const btnSpinner = document.getElementById('btnSpinner');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const forgotPassword = document.getElementById('forgotPassword');



// ==========================================
// ESTADO DE LOS INTENTOS
// ==========================================

let intentos = Number(sessionStorage.getItem("intentos")) || 0;

let bloqueoHasta = Number(
    sessionStorage.getItem("bloqueoHasta")
) || 0;

let intervalo = null;


// ==========================================
// ACTUALIZAR CONTADOR
// ==========================================

function actualizarIntentos() {

    attemptCounter.textContent =
        `Intentos fallidos: ${intentos} de ${MAX_INTENTOS}`;

}


// ==========================================
// MENSAJES
// ==========================================

function mostrarMensaje(mensaje, tipo) {

    loginMessage.textContent = mensaje;

    loginMessage.className = `login-message ${tipo}`;

}

function limpiarMensajes() {

    loginMessage.textContent = "";
    loginMessage.className = "login-message";

    usuarioError.textContent = "";
    passwordError.textContent = "";

}


// ==========================================
// VALIDAR CAMPOS
// ==========================================

function validarCampos(usuario, password) {

    let valido = true;

    limpiarMensajes();

    if (!usuario.trim()) {

        usuarioError.textContent =
            "Ingrese su nombre de usuario.";

        valido = false;

    }

    if (!password) {

        passwordError.textContent =
            "Ingrese su contraseña.";

        valido = false;

    }

    return valido;

}


// ==========================================
// AUTENTICACIÓN DE DEMOSTRACIÓN
// ==========================================

// IMPORTANTE:
// Esta función simula una autenticación.
// En producción debe reemplazarse por una
// petición al backend y una validación segura.

async function autenticarUsuario(usuario, password) {
    // 1. Dominio permitido (debe incluir el '@')
    const dominioPermitido = "@antoniolorena.com";

    // 2. Limpieza de datos (eliminar espacios y pasar a minúsculas)
    const correoLimpio = usuario.trim().toLowerCase();

    if (!usuario?.trim() || !password?.trim()) {
        return {
            autenticado: false,
            mensaje: "Por favor, rellene todos los campos."
        };
    }
    // 3. Validación de terminación de dominio
    if (!correoLimpio.endsWith(dominioPermitido)) {
        return {
            autenticado: false,
            mensaje: `El usuario debe pertenecer al dominio institucional (${dominioPermitido}).`
        };
    }

    // 4. Credenciales de prueba
    const usuarioDemo = `1013456${dominioPermitido}`; // ej: 1013456@hospital.med
    const passwordDemo = "1013456_Jorge";

    if (correoLimpio === usuarioDemo && password === passwordDemo) {
        return {
            autenticado: true,
            rol: "Médico",
            correo: correoLimpio
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

    sessionStorage.setItem(
        "intentos",
        intentos
    );

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
// BLOQUEO TEMPORAL
// ==========================================

function iniciarBloqueo() {

    bloqueoHasta = Date.now() + (TIEMPO_BLOQUEO * 1000);

    sessionStorage.setItem(
        "bloqueoHasta",
        bloqueoHasta
    );

    actualizarBloqueo();

}


function actualizarBloqueo() {

    clearInterval(intervalo);

    function verificarTiempo() {

        const restante = Math.ceil(
            (bloqueoHasta - Date.now()) / 1000
        );

        if (restante > 0) {

            btnLogin.disabled = true;

            lockoutMessage.hidden = false;

            countdown.textContent = restante;

            mostrarMensaje(
                "Se alcanzó el límite de intentos permitidos.",
                "error"
            );

        } else {

            clearInterval(intervalo);

            finalizarBloqueo();

        }

    }

    verificarTiempo();

    if (Date.now() < bloqueoHasta) {

        intervalo = setInterval(
            verificarTiempo,
            1000
        );

    }

}


// ==========================================
// FINALIZAR BLOQUEO
// ==========================================

function finalizarBloqueo() {

    clearInterval(intervalo);

    intentos = 0;
    bloqueoHasta = 0;

    sessionStorage.removeItem("intentos");
    sessionStorage.removeItem("bloqueoHasta");

    btnLogin.disabled = false;

    lockoutMessage.hidden = true;

    mostrarMensaje(
        "El bloqueo ha finalizado. Puede intentar nuevamente.",
        "success"
    );

    actualizarIntentos();

}


// ==========================================
// INICIAR SESIÓN
// ==========================================

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    limpiarMensajes();

    // Comprobar bloqueo

    if (Date.now() < bloqueoHasta) {

        actualizarBloqueo();

        return;

    }

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;

    // Validar campos vacíos

    if (!validarCampos(usuario, password)) {

        return;

    }

    // Deshabilitar botón durante la petición

    btnLogin.disabled = true;

    btnLogin.querySelector("span").textContent =
        "Verificando...";

    try {

        const resultado = await autenticarUsuario(
            usuario,
            password
        );

        if (resultado.autenticado) {

            // Reiniciar intentos

            intentos = 0;

            sessionStorage.removeItem("intentos");
            sessionStorage.removeItem("bloqueoHasta");

            bloqueoHasta = 0;

            actualizarIntentos();

            mostrarMensaje(
                `Bienvenido. Rol: ${resultado.rol}`,
                "success"
            );

            usuarioInput.disabled = true;
            passwordInput.disabled = true;

            btnLogin.querySelector("span").textContent =
                "Acceso concedido";

            // En producción:
            window.location.href = "Pages/dashboard.html";

        } else {

            registrarIntentoFallido();

        }

    } catch (error) {

        mostrarMensaje(
            "No se pudo conectar con el servidor. Intente nuevamente.",
            "error"
        );

    } finally {

        if (!btnLogin.disabled || bloqueoHasta <= Date.now()) {

            if (!btnLogin.disabled) {
                btnLogin.querySelector("span").textContent =
                    "Iniciar sesión";
            }

        }

    }

});


// ==========================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ==========================================

togglePassword.addEventListener("click", function() {

    const visible = passwordInput.type === "password";

    passwordInput.type = visible ? "text" : "password";

    togglePassword.innerHTML = visible
        ? '<ion-icon name="eye-off-outline"></ion-icon>'
        : '<ion-icon name="eye-outline"></ion-icon>';

    togglePassword.setAttribute(
        "aria-label",
        visible ? "Ocultar contraseña" : "Mostrar contraseña"
    );

});


// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================

document.getElementById("forgotPassword")
    .addEventListener("click", function(event) {

        event.preventDefault();

        alert(
            "Para recuperar su contraseña, comuníquese con el administrador del sistema."
        );

    });


// ==========================================
// INICIALIZACIÓN
// ==========================================

actualizarIntentos();

if (Date.now() < bloqueoHasta) {

    actualizarBloqueo();

} else {

    finalizarBloqueo();

}



 // --- 1. Fondo Dinámico: Canvas con Partículas Médicas (Cruces, Células, Moléculas) ---
        const canvas = document.getElementById('medicalCanvas');
        const ctx = canvas.getContext('2d');

        let width, height;
        let particles = [];

        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class MedicalParticle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 12 + 8;
                this.speedX = (Math.random() - 0.5) * 0.45;
                this.speedY = -Math.random() * 0.55 - 0.15; // Flotan suavemente hacia arriba
                this.opacity = Math.random() * 0.28 + 0.12;
                this.type = Math.floor(Math.random() * 3); // 0: Cruz Médica (+), 1: Nodo/Círculo, 2: Rombo de atención
                this.angle = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.015;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.angle += this.rotationSpeed;

                if (this.y < -30 || this.x < -30 || this.x > width + 30) {
                    this.reset();
                    this.y = height + 20;
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = `rgba(56, 189, 248, ${this.opacity})`;
                ctx.strokeStyle = `rgba(15, 118, 110, ${this.opacity * 1.2})`;
                ctx.lineWidth = 1.5;

                if (this.type === 0) {
                    // Símbolo de Cruz Médica
                    const w = this.size;
                    const t = this.size * 0.35;
                    ctx.beginPath();
                    ctx.rect(-w/2, -t/2, w, t);
                    ctx.rect(-t/2, -w/2, t, w);
                    ctx.fill();
                } else if (this.type === 1) {
                    // Célula / Partícula bioluminiscente
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.65, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Cristal molecular / Rombo clínico
                    const s = this.size * 0.45;
                    ctx.beginPath();
                    ctx.moveTo(0, -s);
                    ctx.lineTo(s, 0);
                    ctx.lineTo(0, s);
                    ctx.lineTo(-s, 0);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        const particleCount = Math.min(Math.floor(window.innerWidth / 30), 45);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new MedicalParticle());
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            // Trazar tenues líneas conectoras entre partículas cercanas (red de telemedicina)
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 110) {
                        ctx.strokeStyle = `rgba(2, 132, 199, ${0.08 * (1 - dist / 110)})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();

        // --- 2. Lógica del Formulario, Validaciones y Simulación de Seguridad ---


let failedAttempts = 0;
const MAX_ATTEMPTS = 3;
let lockoutTimer = null;

// Efectos de Focus en los campos
[usuarioInput, passwordInput].forEach(input => {
    const container = input.closest('.input-container');
    input.addEventListener('focus', () => container.classList.add('focused'));
    input.addEventListener('blur', () => {
        container.classList.remove('focused');
        validateSingleField(input);
    });
    input.addEventListener('input', () => {
        container.classList.remove('error');
        if (input === usuarioInput) usuarioError.textContent = '';
        if (input === passwordInput) passwordError.textContent = '';
    });
});

// Alternar Ver / Ocultar Contraseña
if (togglePasswordBtn && passwordInput && toggleIcon) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Alternar tipo de input (password <-> text)
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';

            // 2. Cambiar icono (propiedad directa y atributo para asegurar render en Ionicons)
            const nuevoIcono = isPassword ? 'eye-off-outline' : 'eye-outline';
            toggleIcon.name = nuevoIcono;
            toggleIcon.setAttribute('name', nuevoIcono);

            // 3. Accesibilidad para lectores de pantalla
            togglePasswordBtn.setAttribute(
                'aria-label',
                isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            );
        });
    };

// Función de Validación Individual
function validateSingleField(input) {
    let isValid = true;
    if (input === usuarioInput) {
        if (!usuarioInput.value.trim()) {
            showFieldError(usuarioContainer, usuarioError, 'El usuario o código CMP es requerido.');
            isValid = false;
        } else if (usuarioInput.value.trim().length < 3) {
            showFieldError(usuarioContainer, usuarioError, 'Ingrese al menos 3 caracteres.');
            isValid = false;
        } else {
            clearFieldError(usuarioContainer, usuarioError);
        }
    } else if (input === passwordInput) {
        if (!passwordInput.value) {
            showFieldError(passwordContainer, passwordError, 'Ingrese su contraseña institucional.');
            isValid = false;
        } else if (passwordInput.value.length < 4) {
            showFieldError(passwordContainer, passwordError, 'La contraseña debe tener mínimo 4 caracteres.');
            isValid = false;
        } else {
            clearFieldError(passwordContainer, passwordError);
        }
    }
    return isValid;
}

function showFieldError(container, errorElement, message) {
    container.classList.add('error');
    errorElement.textContent = message;
}

function clearFieldError(container, errorElement) {
    container.classList.remove('error');
    errorElement.textContent = '';
}

// Manejo de Bloqueo por Intentos
function triggerLockout() {
    btnLogin.disabled = true;
    usuarioInput.disabled = true;
    passwordInput.disabled = true;
    lockoutMessage.hidden = false;
    loginMessage.style.display = 'none';

    let secondsLeft = 30;
    countdownSpan.textContent = secondsLeft;

    lockoutTimer = setInterval(() => {
        secondsLeft--;
        countdownSpan.textContent = secondsLeft;

        if (secondsLeft <= 0) {
            clearInterval(lockoutTimer);
            lockoutMessage.hidden = true;
            btnLogin.disabled = false;
            usuarioInput.disabled = false;
            passwordInput.disabled = false;
            failedAttempts = 0;
            updateAttemptCounter();
            showMessage('Puede reintentar su autenticación ahora.', 'success');
        }
    }, 1000);
}

function updateAttemptCounter() {
    attemptCounterText.textContent = `Intentos fallidos: ${failedAttempts} de ${MAX_ATTEMPTS}`;
    if (failedAttempts > 0) {
        attemptCounterText.style.color = '#ef4444';
    } else {
        attemptCounterText.style.color = 'var(--text-muted)';
    }
}

function showMessage(msg, type = 'error') {
    loginMessage.className = `login-message ${type}`;
    loginMessage.innerHTML = `
        <ion-icon name="${type === 'error' ? 'alert-circle' : 'checkmark-circle'}"></ion-icon>
        <span>${msg}</span>
    `;
    loginMessage.style.display = 'flex';
}

// Enlace de Recuperación
forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showMessage('Para restablecer su clave, acérquese a la Oficina de Soporte e Informática o llame al anexo 104.', 'success');
});

// Envío del Formulario
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (btnLogin.disabled) return;

    const isUserValid = validateSingleField(usuarioInput);
    const isPassValid = validateSingleField(passwordInput);

    if (!isUserValid || !isPassValid) {
        return;
    }

    // Estado de Carga
    setLoading(true);
    loginMessage.style.display = 'none';

    // Simulación de Validación Asistencial (Mock Credenciales: admin / 1234 o médico registrado)
    setTimeout(() => {
        setLoading(false);
        const user = usuarioInput.value.trim().toLowerCase();
        const pass = passwordInput.value;

        const isSuccess = (user === 'admin' || user === 'lorena' || user === 'medico') && pass === '1234';

        if (isSuccess) {
            failedAttempts = 0;
            updateAttemptCounter();
            showMessage('Credenciales validadas. Redirigiendo a Historia Clínica...', 'success');
            btnLogin.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            btnText.textContent = 'Acceso Autorizado';
            btnIcon.setAttribute('name', 'checkmark-done-circle-outline');
        } else {
            failedAttempts++;
            updateAttemptCounter();

            if (failedAttempts >= MAX_ATTEMPTS) {
                triggerLockout();
            } else {
                showMessage('Credenciales no válidas para el personal clínico.', 'error');
                showFieldError(usuarioContainer, usuarioError, '');
                showFieldError(passwordContainer, passwordError, 'Verifique usuario y clave.');
            }
        }
    }, 1200);
});

function setLoading(isLoading) {
    if (isLoading) {
        btnLogin.disabled = true;
        btnSpinner.style.display = 'block';
        btnIcon.style.display = 'none';
        btnText.textContent = 'Verificando con Servidor...';
    } else {
        btnLogin.disabled = false;
        btnSpinner.style.display = 'none';
        btnIcon.style.display = 'inline-block';
        btnText.textContent = 'Ingresar al Sistema';
    }
}