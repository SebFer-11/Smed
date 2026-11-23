const citaForm = document.getElementById("citaForm");
const cancelButton = document.getElementById("cancelButton");
const message = document.getElementById("message");

// Elementos de la Sección 1: Paciente
const dniInput = document.getElementById("dni");
const historiaInput = document.getElementById("historia");
const pacienteSelect = document.getElementById("paciente");
const dniCounter = document.getElementById("dniCounter");

// Elementos de la Sección 2 y 3: Médico, Especialidad, Fecha, Hora y Consultorio
const especialidadSelect = document.getElementById("especialidad");
const medicoSelect = document.getElementById("medico");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora");
const consultorioSelect = document.getElementById("consultorio");
const observacionesInput = document.getElementById("observaciones");

// Estado en memoria
let pacienteSeleccionado = null;
let profesionalesCache = [];
let consultoriosCache = [];

// ==========================================
// INICIALIZACIÓN DEL MÓDULO
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    // Bloquear edición manual de historia clínica tras autocompletar
    if (historiaInput) {
        historiaInput.readOnly = true;
    }

    // Cargar catálogos dinámicos desde Supabase si están disponibles
    await cargarCatalogosIniciales();
});

async function cargarCatalogosIniciales() {
    try {
        // Cargar profesionales activos
        const profesionales = await supabaseGet(
            "profesionales",
            "?select=*&activo=eq.true&order=id.asc"
        );

        if (profesionales && profesionales.length > 0) {
            profesionalesCache = profesionales;
            medicoSelect.innerHTML = '<option value="">Seleccione un médico</option>';
            profesionales.forEach((prof) => {
                const opt = document.createElement("option");
                opt.value = prof.id;
                const nombreProf = [prof.nombres, prof.apellido_paterno, prof.apellido_materno, prof.apellidos]
                    .filter(Boolean)
                    .join(" ");
                opt.textContent = `Dr(a). ${nombreProf}`;
                medicoSelect.appendChild(opt);
            });
        }

        // Cargar consultorios activos
        const consultorios = await supabaseGet(
            "consultorios",
            "?select=*&activo=eq.true&order=id.asc"
        );

        if (consultorios && consultorios.length > 0) {
            consultoriosCache = consultorios;
            consultorioSelect.innerHTML = '<option value="">Seleccione</option>';
            consultorios.forEach((cons) => {
                const opt = document.createElement("option");
                opt.value = cons.id;
                opt.textContent = cons.nombre || cons.codigo || `Consultorio ${cons.numero || cons.id}`;
                consultorioSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.warn("Usando opciones estáticas del HTML para catálogos:", error);
    }
}

// ==========================================
// 1. AUTOCOMPLETAR PACIENTE E HISTORIA POR DNI
// ==========================================

dniInput.addEventListener("input", async function () {
    // Sanitizar: solo dígitos numéricos, máximo 8 caracteres
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 8);
    const dni = this.value;

    // Limpiar datos si aún no se completan los 8 dígitos
    if (dni.length < 8) {
        pacienteSeleccionado = null;
        historiaInput.value = "";
        pacienteSelect.value = "";
        limpiarMensaje();
        return;
    }

    // Al llegar a 8 dígitos, consultar automáticamente en Supabase
    try {
        mostrarMensaje("Buscando paciente en el padrón...", "#0d9488");

        const pacientes = await supabaseGet(
            "pacientes",
            `?select=*&dni=eq.${dni}`
        );

        if (!pacientes || pacientes.length === 0) {
            pacienteSeleccionado = null;
            historiaInput.value = "";
            pacienteSelect.value = "";
            mostrarMensaje("No se encontró un paciente con ese DNI.", "red");
            return;
        }

        const paciente = pacientes[0];
        pacienteSeleccionado = paciente;

        // 1. Rellenar Historia Clínica
        historiaInput.value = paciente.historia_clinica || "Sin historia registrada";

        // 2. Construir nombre completo desde las columnas reales de Supabase
        const nombreCompleto = [
            paciente.nombres,
            paciente.apellido_paterno,
            paciente.apellido_materno
        ]
            .filter(Boolean)
            .join(" ");

        // 3. Seleccionar o insertar dinámicamente en <select id="paciente">
        let optionExistente = pacienteSelect.querySelector(`option[value="${paciente.id}"]`);
        if (!optionExistente) {
            optionExistente = document.createElement("option");
            optionExistente.value = paciente.id;
            pacienteSelect.appendChild(optionExistente);
        }
        optionExistente.textContent = nombreCompleto;
        pacienteSelect.value = paciente.id;

        mostrarMensaje(`Paciente verificado: ${nombreCompleto} (HC: ${historiaInput.value})`, "green");
    } catch (error) {
        console.error("Error al consultar paciente por DNI:", error);
        pacienteSeleccionado = null;
        mostrarMensaje("Error al consultar el DNI del paciente.", "red");
    }
});

// Sincronizar consultorio automáticamente cuando se elige un médico (si hay datos en caché)
if (medicoSelect) {
    medicoSelect.addEventListener("change", function () {
        const medicoId = this.value;
        const prof = profesionalesCache.find((p) => String(p.id) === String(medicoId));
        if (prof && prof.especialidad_id && consultoriosCache.length > 0) {
            const consCompatible = consultoriosCache.find(
                (c) =>
                    String(c.especialidad_id) === String(prof.especialidad_id) &&
                    String(c.establecimiento_id) === String(prof.establecimiento_id)
            );
            if (consCompatible) {
                consultorioSelect.value = consCompatible.id;
            }
        }
    });
}

// ==========================================
// 2. REGISTRAR CITA MÉDICA (VALIDACIONES RC-01 A RC-13)
// ==========================================

citaForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = citaForm.querySelector('button[type="submit"]');
    const dni = dniInput.value.trim();
    const fecha = fechaInput.value;
    const hora = horaSelect.value;
    const observaciones = observacionesInput ? observacionesInput.value.trim() || null : null;

    // ------------------------------------------
    // CASO RC-02: VALIDAR FORMATO DE DNI (8 DÍGITOS)
    // ------------------------------------------
    if (!/^\d{8}$/.test(dni)) {
        mostrarMensaje("El DNI debe tener 8 dígitos.", "red");
        dniInput.focus();
        return;
    }

    // ------------------------------------------
    // CASO RC-03: VALIDAR FECHA Y HORA OBLIGATORIAS
    // ------------------------------------------
    if (!fecha || !hora) {
        mostrarMensaje("Seleccione una fecha y hora.", "red");
        return;
    }

    // ------------------------------------------
    // VALIDACIÓN EXTRA: EVITAR FECHAS PASADAS
    // ------------------------------------------
    const hoyStr = new Date().toISOString().split("T")[0];
    if (fecha < hoyStr) {
        mostrarMensaje("No se puede registrar una cita en una fecha pasada.", "red");
        fechaInput.focus();
        return;
    }

    // Bloquear botón para evitar envíos duplicados
    if (submitButton) submitButton.disabled = true;

    try {
        // ------------------------------------------
        // CASO RC-04: VERIFICAR EXISTENCIA DEL PACIENTE
        // ------------------------------------------
        let paciente = pacienteSeleccionado;

        if (!paciente || paciente.dni !== dni) {
            const pacientes = await supabaseGet(
                "pacientes",
                `?select=*&dni=eq.${dni}`
            );

            if (!pacientes || pacientes.length === 0) {
                mostrarMensaje("No se encontró un paciente con ese DNI.", "red");
                return;
            }

            paciente = pacientes[0];
        }

        console.log("PACIENTE VERIFICADO:", paciente);

        // ------------------------------------------
        // CASO RC-05 (RN-01): MÁXIMO 2 CITAS PROGRAMADAS POR PACIENTE
        // ------------------------------------------
        const citasPaciente = await supabaseGet(
            "citas",
            `?select=id,fecha,hora_inicio,estado&paciente_id=eq.${paciente.id}&estado=eq.PROGRAMADA`
        );

        if (citasPaciente && citasPaciente.length >= 1 ) {
            mostrarMensaje("El paciente ya tiene el máximo de 1 cita(s) programada(s).", "red");
            return;
        }

        // ------------------------------------------
        // VALIDACIÓN EXTRA: CRUCE DE HORARIO DEL MISMO PACIENTE
        // ------------------------------------------
        const crucePaciente = citasPaciente?.find(
            (c) => c.fecha === fecha && c.hora_inicio === `${hora}:00`
        );
        if (crucePaciente) {
            mostrarMensaje("El paciente ya tiene una cita programada en esa misma fecha y hora.", "red");
            return;
        }

        // ------------------------------------------
        // CASO RC-06: VERIFICAR DISPONIBILIDAD DEL HORARIO
        // ------------------------------------------
        const citasHorario = await supabaseGet(
            "citas",
            `?select=id,profesional_id&fecha=eq.${fecha}&hora_inicio=eq.${hora}:00&estado=eq.PROGRAMADA`
        );

        if (citasHorario && citasHorario.length > 0) {
            mostrarMensaje("El horario seleccionado ya está ocupado.", "red");
            return;
        }

        // ------------------------------------------
        // CASO RC-07: VERIFICAR PROFESIONALES ACTIVOS DISPONIBLES
        // ------------------------------------------
        const profesionales = await supabaseGet(
            "profesionales",
            "?select=*&activo=eq.true&order=id.asc"
        );

        if (!profesionales || profesionales.length === 0) {
            mostrarMensaje("No hay médicos disponibles para registrar la cita.", "red");
            return;
        }

        // Si el usuario seleccionó un médico específico en el select y existe en BD, usarlo;
        // de lo contrario, asignar el primer médico activo disponible.
        const medicoSeleccionadoId = medicoSelect ? medicoSelect.value : "";
        const profesional =
            profesionales.find((p) => String(p.id) === String(medicoSeleccionadoId)) ||
            profesionales[0];

        console.log("PROFESIONAL SELECCIONADO:", profesional);

        // ------------------------------------------
        // CASO RC-08: VALIDAR ESTABLECIMIENTO DEL PROFESIONAL
        // ------------------------------------------
        if (!profesional.establecimiento_id) {
            throw new Error("RC-08: El médico no tiene un establecimiento asignado.");
        }

        // ------------------------------------------
        // CASO RC-09: VALIDAR ESPECIALIDAD DEL PROFESIONAL
        // ------------------------------------------
        if (!profesional.especialidad_id) {
            throw new Error("RC-09: El médico no tiene una especialidad asignada.");
        }

        const establecimientoId = profesional.establecimiento_id;
        const especialidadId = profesional.especialidad_id;

        // ------------------------------------------
        // CASO RC-10 & RC-11: BUSCAR Y ASIGNAR CONSULTORIO COMPATIBLE
        // ------------------------------------------
        const consultorios = await supabaseGet(
            "consultorios",
            `?select=*&especialidad_id=eq.${especialidadId}&establecimiento_id=eq.${establecimientoId}&activo=eq.true&order=id.asc`
        );

        if (!consultorios || consultorios.length === 0) {
            throw new Error(
                "RC-10: No hay consultorio disponible para la especialidad y establecimiento del médico."
            );
        }

        const consultorioSeleccionadoId = consultorioSelect ? consultorioSelect.value : "";
        const consultorio =
            consultorios.find((c) => String(c.id) === String(consultorioSeleccionadoId)) ||
            consultorios[0];

        if (!consultorio.id) {
            throw new Error("RC-11: El consultorio encontrado no tiene un ID válido.");
        }

        console.log("CONSULTORIO ASIGNADO:", consultorio);

        // ------------------------------------------
        // CASO RC-12: CALCULAR HORA DE FINALIZACIÓN (+30 MIN)
        // ------------------------------------------
        const horaFin = calcularHoraFin(hora);

        // ------------------------------------------
        // CASO RC-01 & RC-13: CONSTRUIR OBJETO CITA CON ESTADO "PROGRAMADA"
        // ------------------------------------------
        const nuevaCita = {
            paciente_id: paciente.id,
            profesional_id: profesional.id,
            consultorio_id: consultorio.id,
            fecha: fecha,
            hora_inicio: `${hora}:00`,
            hora_fin: horaFin,
            estado: "PROGRAMADA",
            observaciones: observaciones,
            usuario_registro_id: null
        };

        console.log("CITA A REGISTRAR:", nuevaCita);

        // ------------------------------------------
        // INSERTAR REGISTRO EN SUPABASE
        // ------------------------------------------
        const resultado = await supabasePost("citas", nuevaCita);
        console.log("CITA REGISTRADA EXITOSAMENTE:", resultado);

        // ------------------------------------------
        // CONFIRMACIÓN Y LIMPIEZA DEL FORMULARIO
        // ------------------------------------------
        mostrarMensaje("Cita registrada correctamente.", "green");

        citaForm.reset();
        pacienteSeleccionado = null;

        // Restaurar valores visuales por defecto (contador y fecha de hoy)
        if (dniCounter) {
            dniCounter.textContent = "0 / 8 dígitos";
            dniCounter.style.color = "var(--slate-400)";
        }
        if (fechaInput) {
            fechaInput.value = hoyStr;
        }
    } catch (error) {
        console.error("Error al registrar cita:", error);
        mostrarMensaje("Ocurrió un error al registrar la cita.", "red");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function calcularHoraFin(horaInicio) {
    const partes = horaInicio.split(":");
    let horas = parseInt(partes[0], 10);
    let minutos = parseInt(partes[1], 10);

    // Duración estándar de consulta médica: 30 minutos
    minutos += 30;

    if (minutos >= 60) {
        horas += Math.floor(minutos / 60);
        minutos = minutos % 60;
    }

    return (
        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0") +
        ":00"
    );
}

function mostrarMensaje(texto, color) {
    if (!message) return;
    message.textContent = texto;
    message.style.color = color;
}

function limpiarMensaje() {
    if (!message) return;
    message.textContent = "";
}

// ==========================================
// CANCELAR / VOLVER AL DASHBOARD
// ==========================================

cancelButton.addEventListener("click", function () {
    const confirmar = confirm("¿Desea cancelar el registro de la cita?");
    if (confirmar) {
        window.location.href = "../dashboard.html";
    }
});