document.addEventListener("DOMContentLoaded", async () => {
    // ==========================================
    // 1. FECHA DINÁMICA Y MENÚ MÓVIL
    // ==========================================
    const dateSpan = document.getElementById("currentDateString");
    if (dateSpan) {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const formattedDate = now.toLocaleDateString("es-ES", options);
        dateSpan.querySelector("span").textContent =
            formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    const toggleMenuBtn = document.getElementById("toggleMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function toggleDrawer() {
        sidebar?.classList.toggle("mobile-open");
        sidebarOverlay?.classList.toggle("active");
    }

    toggleMenuBtn?.addEventListener("click", toggleDrawer);
    sidebarOverlay?.addEventListener("click", toggleDrawer);

    // ==========================================
    // 2. CARGA DE DATOS REALES DESDE SUPABASE
    // ==========================================
    await cargarDatosDashboard();

    // ==========================================
    // 3. FILTRADO DE TABLA Y BUSCADOR GLOBAL
    // ==========================================
    let filtroEstadoActual = "all";
    let textoBusquedaActual = "";

    function aplicarFiltrosTabla() {
        const rows = document.querySelectorAll("#appointmentsTable tbody tr[data-status]");
        rows.forEach((row) => {
            const status = row.dataset.status;
            const rowText = row.innerText.toLowerCase();

            const coincideEstado =
                filtroEstadoActual === "all" || status === filtroEstadoActual;
            const coincideTexto =
                textoBusquedaActual === "" || rowText.includes(textoBusquedaActual);

            row.style.display = coincideEstado && coincideTexto ? "" : "none";
        });
    }

    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstadoActual = btn.dataset.filter;
            aplicarFiltrosTabla();
        });
    });

    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            textoBusquedaActual = e.target.value.toLowerCase().trim();
            aplicarFiltrosTabla();
        });

        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

    // ==========================================
    // 4. NOTIFICACIONES Y CERRAR SESIÓN
    // ==========================================
    const notifBtn = document.getElementById("notifBtn");
    notifBtn?.addEventListener("click", () => {
        const pendientes = document.getElementById("metricCitasPendientes")?.textContent || "0";
        showToast(`Tiene ${pendientes} en agenda asistencial.`);
    });

    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => {
        if (!confirm("¿Está seguro de que desea cerrar sesión?")) return;
        sessionStorage.clear();
        showToast("Cerrando sesión de forma segura...");
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 900);
    });
});

// ==========================================
// FUNCIÓN PRINCIPAL DE CONSULTA A SUPABASE
// ==========================================
async function cargarDatosDashboard() {
    try {
        // Consultamos todas las tablas en paralelo para minimizar latencia
        const [pacientes, citas, atenciones, profesionales, especialidades] = await Promise.all([
            supabaseGet("pacientes", "?select=*"),
            supabaseGet("citas", "?select=*&order=fecha.asc,hora_inicio.asc"),
            supabaseGet("atenciones", "?select=*"),
            supabaseGet("profesionales", "?select=*"),
            supabaseGet("especialidades", "?select=*")
        ]);

        const listaPacientes = Array.isArray(pacientes) ? pacientes : [];
        const listaCitas = Array.isArray(citas) ? citas : [];
        const listaAtenciones = Array.isArray(atenciones) ? atenciones : [];
        const listaProfesionales = Array.isArray(profesionales) ? profesionales : [];
        const listaEspecialidades = Array.isArray(especialidades) ? especialidades : [];

        // Mapas de búsqueda rápida por ID (O(1))
        const mapaPacientes = new Map(listaPacientes.map((p) => [p.id, p]));
        const mapaProfesionales = new Map(listaProfesionales.map((pr) => [pr.id, pr]));
        const mapaEspecialidades = new Map(listaEspecialidades.map((e) => [e.id, e.nombre]));

        // ------------------------------------------
        // A. ACTUALIZAR MÉTRICAS SUPERIORES
        // ------------------------------------------
        const hoyISO = new Date().toISOString().split("T")[0];
        const citasHoy = listaCitas.filter((c) => c.fecha === hoyISO);
        const citasProgramadas = listaCitas.filter((c) => c.estado === "PROGRAMADA");
        const atencionesHoy = listaAtenciones.filter((a) =>
            String(a.fecha_hora || "").startsWith(hoyISO)
        );

        const totalCitasRef = citasHoy.length > 0 ? citasHoy.length : listaCitas.length;
        const totalAtencionesRef = atencionesHoy.length > 0 ? atencionesHoy.length : listaAtenciones.length;
        const porcentajeAvance =
            totalCitasRef > 0 ? Math.round((totalAtencionesRef / totalCitasRef) * 100) : 0;

        setText("metricPacientes", listaPacientes.length);
        setText("metricCitasHoy", citasHoy.length > 0 ? citasHoy.length : citasProgramadas.length);
        setText("metricCitasPendientes", `${citasProgramadas.length} programadas`);
        setText("metricAtenciones", listaAtenciones.length);
        setText("metricAvance", `${porcentajeAvance}% avance`);
        setText("metricProfesionales", listaProfesionales.length);

        // ------------------------------------------
        // B. RENDERIZAR TABLA DE PRÓXIMAS CITAS
        // ------------------------------------------
        renderizarTablaCitas(listaCitas, mapaPacientes, mapaProfesionales, mapaEspecialidades);

        // ------------------------------------------
        // C. RENDERIZAR MÉDICOS EN GUARDIA (WIDGET)
        // ------------------------------------------
        renderizarMedicosGuardia(listaProfesionales, mapaEspecialidades);

    } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        showToast("No se pudieron sincronizar los datos con Supabase.");
    }
}

function renderizarTablaCitas(citas, mapaPacientes, mapaProfesionales, mapaEspecialidades) {
    const tbody = document.getElementById("appointmentsBody");
    if (!tbody) return;

    // Priorizamos citas PROGRAMADAS o EN_CONSULTA; si no hay, mostramos las más recientes
    const citasActivas = citas.filter((c) => c.estado !== "CANCELADA");

    if (citasActivas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">
                    No hay citas registradas en el sistema.
                </td>
            </tr>
        `;
        return;
    }

    const paletasAvatar = [
        "background:#e0f2fe; color:#0369a1;",
        "background:#fce7f3; color:#be185d;",
        "background:#ecfdf5; color:#047857;",
        "background:#fef3c7; color:#b45309;"
    ];

    tbody.innerHTML = citasActivas
        .slice(0, 15)
        .map((cita, idx) => {
            const paciente = mapaPacientes.get(cita.paciente_id) || {};
            const profesional = mapaProfesionales.get(cita.profesional_id) || {};

            const nombrePaciente =
                [paciente.nombres, paciente.apellido_paterno, paciente.apellido_materno]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || "Paciente sin nombre";

            const iniciales = nombrePaciente
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

            const dni = paciente.dni || "Sin DNI";
            const hc = paciente.historia_clinica || "Sin HC";

            const nombreMedico =
                `${profesional.nombres || ""} ${profesional.apellidos || ""}`.trim() ||
                "Médico por asignar";
            const especialidad =
                mapaEspecialidades.get(profesional.especialidad_id) || "Medicina General";

            const fechaFmt = formatearFecha(cita.fecha);
            const horaFmt = cita.hora_inicio ? `${cita.hora_inicio.substring(0, 5)} hrs` : "--:--";

            // Mapeo de estado BD -> filtro y badge del CSS
            const estadoBD = String(cita.estado || "PROGRAMADA").toUpperCase();
            let dataStatus = "programada";
            let badgeClass = "badge-scheduled";
            let badgeLabel = "Programada";
            let actionIcon = "enter-outline";
            let actionLabel = "Atender";

            if (estadoBD === "EN_ESPERA") {
                dataStatus = "espera";
                badgeClass = "badge-waiting";
                badgeLabel = "En Espera";
            } else if (estadoBD === "EN_CONSULTA") {
                dataStatus = "in_progress";
                badgeClass = "badge-in-progress";
                badgeLabel = "En Consulta";
                actionIcon = "pulse-outline";
                actionLabel = "Evolución";
            } else if (estadoBD === "ATENDIDA") {
                dataStatus = "atendida";
                badgeClass = "badge-in-progress";
                badgeLabel = "Atendida";
                actionIcon = "eye-outline";
                actionLabel = "Historial";
            }

            const estiloAvatar = paletasAvatar[idx % paletasAvatar.length];

            return `
                <tr data-status="${dataStatus}">
                    <td>
                        <div class="patient-cell">
                            <div class="patient-avatar" style="${estiloAvatar}">${iniciales}</div>
                            <div class="patient-info">
                                <strong>${nombrePaciente}</strong>
                                <span>DNI: ${dni} · HC: ${hc}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="doctor-cell">
                            <strong>${nombreMedico}</strong>
                            <span>${especialidad}</span>
                        </div>
                    </td>
                    <td>
                        <div class="datetime-cell">
                            <span><ion-icon name="calendar-outline"></ion-icon> ${fechaFmt}</span>
                            <span><ion-icon name="time-outline"></ion-icon> ${horaFmt}</span>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">
                            <span class="badge-dot"></span> ${badgeLabel}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn-table-action" onclick="irAAtencion('${dni}', '${estadoBD}')">
                            <ion-icon name="${actionIcon}"></ion-icon> ${actionLabel}
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderizarMedicosGuardia(profesionales, mapaEspecialidades) {
    const container = document.getElementById("dutyDoctorsList");
    if (!container) return;

    if (profesionales.length === 0) {
        container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Sin especialistas registrados.</p>`;
        return;
    }

    const estilosIcono = [
        "",
        "background:#ccfbf1; color:#0f766e;",
        "background:#fef3c7; color:#d97706;"
    ];

    container.innerHTML = profesionales
        .slice(0, 4)
        .map((prof, idx) => {
            const nombre = `${prof.nombres || ""} ${prof.apellidos || ""}`.trim();
            const especialidad = mapaEspecialidades.get(prof.especialidad_id) || "Guardia General";
            const estilo = estilosIcono[idx % estilosIcono.length];

            return `
                <div class="duty-doctor-item">
                    <div class="doctor-thumb" style="${estilo}">
                        <ion-icon name="person"></ion-icon>
                    </div>
                    <div class="doctor-thumb-meta">
                        <strong>${nombre}</strong>
                        <span>${especialidad} · Consultorio ${idx + 1}</span>
                    </div>
                </div>
            `;
        })
        .join("");
}

// ==========================================
// UTILIDADES
// ==========================================
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";
    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function showToast(message) {
    const toast = document.getElementById("toastNotify");
    const msg = document.getElementById("toastMessage");
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

// Redirige al módulo correspondiente pasando el DNI por URL si lo deseas
function irAAtencion(dni, estado) {
    if (estado === "ATENDIDA") {
        window.location.href = `atencion/consultar.html?dni=${encodeURIComponent(dni)}`;
    } else {
        window.location.href = `atencion/registrar.html?dni=${encodeURIComponent(dni)}`;
    }
}