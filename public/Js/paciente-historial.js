
// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

const historyForm = document.getElementById("historyForm");
const historyResult = document.getElementById("historyResult");
const emptyHistoryState = document.getElementById("emptyHistoryState");
const message = document.getElementById("message");

const dniInput = document.getElementById("dni");
const dniCounter = document.getElementById("dniCounter");

const btnSubmit = document.getElementById("btnSubmitHistory");
const btnSpinner = document.getElementById("btnSpinner");
const btnIcon = document.getElementById("btnIcon");
const btnText = document.getElementById("btnText");

const timelineContainer = document.getElementById("timelineContainer");


// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Contador y validación visual del DNI
    if (dniInput) {
        dniInput.addEventListener("input", () => {

            dniInput.value = dniInput.value
                .replace(/\D/g, "")
                .slice(0, 8);

            if (dniCounter) {
                dniCounter.textContent =
                    `${dniInput.value.length}/8 dígitos`;
            }
        });
    }

    // Filtros de especialidad
    configurarFiltros();

    // Estado inicial
    if (historyResult && emptyHistoryState) {
        emptyHistoryState.style.display = "block";
    }

});


// ==========================================
// CONSULTAR HISTORIAL CLÍNICO
// ==========================================

historyForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const dni = dniInput.value.trim();

    // Ocultar mensaje anterior
    message.textContent = "";
    message.style.display = "none";

    // Validar DNI
    if (!/^\d{8}$/.test(dni)) {

        ocultarResultados();

        mostrarMensaje(
            "El DNI debe tener 8 dígitos.",
            "red"
        );

        return;
    }

    // Activar botón de carga
    cambiarEstadoBoton(true);

    try {

        // ======================================
        // 1. BUSCAR PACIENTE
        // ======================================

        const pacientes = await supabaseGet(
            "pacientes",
            `?select=*&dni=eq.${dni}`
        );

        if (!pacientes || pacientes.length === 0) {

            ocultarResultados();

            mostrarMensaje(
                "No se encontró el paciente.",
                "red"
            );

            return;
        }

        const paciente = pacientes[0];


        // ======================================
        // 2. BUSCAR ATENCIONES
        // ======================================

        const atenciones = await supabaseGet(
            "atenciones",
            `?select=*&paciente_id=eq.${paciente.id}&order=fecha_hora.desc`
        );

        if (!atenciones || atenciones.length === 0) {

            ocultarResultados();

            mostrarMensaje(
                "El paciente no tiene atenciones registradas.",
                "red"
            );

            return;
        }


        // ======================================
        // 3. MOSTRAR HISTORIAL
        // ======================================

        await mostrarHistorial(paciente, atenciones);

        historyResult.classList.remove("hidden");

        if (emptyHistoryState) {
            emptyHistoryState.style.display = "none";
        }

        mostrarMensaje(
            "Historial clínico encontrado.",
            "green"
        );

    } catch (error) {

        console.error(
            "Error al consultar historial:",
            error
        );

        ocultarResultados();

        mostrarMensaje(
            "Ocurrió un error al consultar el historial.",
            "red"
        );

    } finally {

        // Restaurar botón incluso si ocurre un error
        cambiarEstadoBoton(false);
    }

});


// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

async function mostrarHistorial(paciente, atenciones) {

    // ======================================
    // DATOS DEL PACIENTE
    // ======================================

    const nombreCompleto = [
        paciente.nombres,
        paciente.apellido_paterno,
        paciente.apellido_materno
    ]
        .filter(Boolean)
        .join(" ");

    establecerTexto("patientFullName", nombreCompleto);
    establecerTexto("patientDniText", paciente.dni);
    establecerTexto(
        "patientAvatar",
        obtenerIniciales(nombreCompleto)
    );

    // Historia clínica: el HTML no tenía un ID específico
    const historiaElemento = document.querySelector(
        ".patient-info > div:nth-child(3) strong"
    );

    if (historiaElemento) {
        historiaElemento.textContent =
            paciente.historia_clinica || "No registrada";
    }


    // ======================================
    // LIMPIAR ATENCIONES ANTERIORES
    // ======================================

    timelineContainer.innerHTML = "";


    // ======================================
    // RECORRER ATENCIONES
    // ======================================

    for (const atencion of atenciones) {

        let medico = "No registrado";
        let especialidad = "No registrada";

        // Buscar profesional
        if (atencion.profesional_id) {

            const profesionales = await supabaseGet(
                "profesionales",
                `?select=*&id=eq.${atencion.profesional_id}`
            );

            if (profesionales && profesionales.length > 0) {

                const profesional = profesionales[0];

                medico = [
                    profesional.nombres,
                    profesional.apellidos
                ]
                    .filter(Boolean)
                    .join(" ") || "No registrado";


                // Buscar especialidad
                if (profesional.especialidad_id) {

                    const especialidades = await supabaseGet(
                        "especialidades",
                        `?select=*&id=eq.${profesional.especialidad_id}`
                    );

                    if (especialidades && especialidades.length > 0) {

                        especialidad =
                            especialidades[0].nombre || "No registrada";
                    }
                }
            }
        }


        // ==================================
        // FECHA DE ATENCIÓN
        // ==================================

        const fecha = atencion.fecha_hora
            ? new Date(atencion.fecha_hora).toLocaleString("es-PE")
            : "Fecha no registrada";


        // ==================================
        // CREAR TARJETA
        // ==================================

        const item = document.createElement("article");

        item.classList.add("medical-record");

        item.dataset.specialty = especialidad;

        const encabezado = document.createElement("div");
        encabezado.classList.add("record-header");

        const informacion = document.createElement("div");

        const fechaElemento = document.createElement("strong");
        fechaElemento.textContent = `Atención del ${fecha}`;

        const especialidadElemento = document.createElement("span");
        especialidadElemento.textContent = especialidad;

        informacion.appendChild(fechaElemento);
        informacion.appendChild(especialidadElemento);

        const estado = document.createElement("span");
        estado.classList.add("status");
        estado.textContent = "Atención registrada";

        encabezado.appendChild(informacion);
        encabezado.appendChild(estado);


        // ==================================
        // CONTENIDO DE LA ATENCIÓN
        // ==================================

        const cuerpo = document.createElement("div");
        cuerpo.classList.add("record-body");

        agregarCampo(cuerpo, "Médico", medico);
        agregarCampo(cuerpo, "Especialidad", especialidad);

        agregarCampo(
            cuerpo,
            "Diagnóstico",
            atencion.diagnostico || "No registrado"
        );

        agregarCampo(
            cuerpo,
            "Tratamiento",
            atencion.tratamiento || "No registrado"
        );

        item.appendChild(encabezado);
        item.appendChild(cuerpo);

        timelineContainer.appendChild(item);
    }


    // ======================================
    // TOTAL DE ATENCIONES
    // ======================================

    const totalElemento = document.querySelector(
        ".history-footer-actions > div:last-child span"
    );

    if (totalElemento) {
        totalElemento.textContent = `${atenciones.length} atenciones`;
    }

    // Restablecer filtro "Todas"
    const filtroTodas = document.querySelector(
        '.filter-chip[data-filter="all"]'
    );

    if (filtroTodas) {
        document.querySelectorAll(".filter-chip")
            .forEach(chip => chip.classList.remove("active"));

        filtroTodas.classList.add("active");
    }
}


// ==========================================
// AGREGAR CAMPO A UNA ATENCIÓN
// ==========================================

function agregarCampo(contenedor, titulo, valor) {

    const campo = document.createElement("div");

    const encabezado = document.createElement("h3");
    encabezado.textContent = titulo;

    const contenido = document.createElement("p");
    contenido.textContent = valor;

    campo.appendChild(encabezado);
    campo.appendChild(contenido);

    contenedor.appendChild(campo);
}


// ==========================================
// FILTROS DE ESPECIALIDAD
// ==========================================

function configurarFiltros() {

    const filterChips = document.querySelectorAll(".filter-chip");

    filterChips.forEach(chip => {

        chip.addEventListener("click", () => {

            filterChips.forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            const filtro = chip.dataset.filter;

            const registros = document.querySelectorAll(
                "#timelineContainer .medical-record"
            );

            registros.forEach(registro => {

                const especialidad =
                    registro.dataset.specialty || "";

                if (
                    filtro === "all" ||
                    especialidad.toLowerCase().includes(
                        filtro.toLowerCase()
                    )
                ) {
                    registro.style.display = "";
                } else {
                    registro.style.display = "none";
                }

            });

        });

    });

}


// ==========================================
// UTILIDADES
// ==========================================

function establecerTexto(id, texto) {

    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}


function obtenerIniciales(nombre) {

    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(palabra => palabra[0].toUpperCase())
        .join("") || "PX";
}


function mostrarMensaje(texto, color) {

    message.textContent = texto;
    message.style.color = color;
    message.style.display = "block";
}


function ocultarResultados() {

    historyResult.classList.add("hidden");

    if (emptyHistoryState) {
        emptyHistoryState.style.display = "block";
    }

}


function cambiarEstadoBoton(cargando) {

    btnSubmit.disabled = cargando;

    btnSpinner.style.display =
        cargando ? "block" : "none";

    btnIcon.style.display =
        cargando ? "none" : "inline-block";

    btnText.textContent =
        cargando ? "Buscando..." : "Consultar historial";

}


// ==========================================
// BÚSQUEDA RÁPIDA PARA PRUEBAS
// ==========================================

function quickSearch(dniValue) {

    dniInput.value = dniValue;

    dniInput.dispatchEvent(
        new Event("input")
    );

    historyForm.requestSubmit();

}


// ==========================================
// COPIAR DNI
// ==========================================

async function copyPatientDni() {

    const dni = document.getElementById("patientDniText");

    const valor = dni
        ? dni.textContent.trim()
        : dniInput.value.trim();

    if (!valor) return;

    try {

        await navigator.clipboard.writeText(valor);

        mostrarMensaje(
            `DNI ${valor} copiado al portapapeles.`,
            "green"
        );

    } catch (error) {

        console.error("Error al copiar DNI:", error);

        mostrarMensaje(
            "No se pudo copiar el DNI.",
            "red"
        );

    }

}
