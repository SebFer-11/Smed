const historyForm =
    document.getElementById("historyForm");

const historyResult =
    document.getElementById("historyResult");

const message =
    document.getElementById("message");


// ==========================================
// BUSCAR HISTORIAL
// ==========================================

historyForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const dni =
            document.getElementById("dni")
                .value
                .trim();


        // ==========================================
        // VALIDAR DNI
        // ==========================================

        if (!/^\d{8}$/.test(dni)) {

            historyResult.classList.add(
                "hidden"
            );

            message.textContent =
                "El DNI debe tener 8 dígitos.";

            message.style.color =
                "red";

            return;
        }


        try {

            // ==========================================
            // BUSCAR PACIENTE
            // ==========================================

            const pacientes =
                await supabaseGet(
                    "pacientes",
                    `?select=*&dni=eq.${dni}`
                );


            if (
                !pacientes ||
                pacientes.length === 0
            ) {

                historyResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "No se encontró el paciente.";

                message.style.color =
                    "red";

                return;
            }


            const paciente =
                pacientes[0];


            // ==========================================
            // BUSCAR ATENCIONES
            // ==========================================

            const atenciones =
                await supabaseGet(
                    "atenciones",
                    `?select=*&paciente_id=eq.${paciente.id}&order=fecha_hora.desc`
                );


            if (
                !atenciones ||
                atenciones.length === 0
            ) {

                historyResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "El paciente no tiene atenciones registradas.";

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // MOSTRAR INFORMACIÓN
            // ==========================================

            await mostrarHistorial(
                paciente,
                atenciones
            );


            historyResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Historial clínico encontrado.";

            message.style.color =
                "green";


        } catch (error) {

            console.error(
                "Error al consultar historial:",
                error
            );

            historyResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar el historial.";

            message.style.color =
                "red";
        }
    }
);


// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

async function mostrarHistorial(
    paciente,
    atenciones
) {

    // ==========================================
    // DATOS DEL PACIENTE
    // ==========================================

    establecerTexto(
        "nombrePaciente",
        `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ""}`
    );

    establecerTexto(
        "dniPaciente",
        paciente.dni
    );

    establecerTexto(
        "historiaClinica",
        paciente.historia_clinica ||
        "No registrada"
    );


    // ==========================================
    // CONTENEDOR DEL HISTORIAL
    // ==========================================

    /*
     * Intentamos encontrar un contenedor
     * específico para las atenciones.
     */

    const contenedor =
        document.getElementById(
            "atencionesContainer"
        );


    if (!contenedor) {

        console.warn(
            "No existe #atencionesContainer en el HTML."
        );

        return;
    }


    contenedor.innerHTML = "";


    // ==========================================
    // RECORRER ATENCIONES
    // ==========================================

    for (const atencion of atenciones) {

        let medico =
            "No registrado";

        let especialidad =
            "No registrada";


        // ==========================================
        // BUSCAR PROFESIONAL
        // ==========================================

        if (atencion.profesional_id) {

            const profesionales =
                await supabaseGet(
                    "profesionales",
                    `?select=*&id=eq.${atencion.profesional_id}`
                );


            if (
                profesionales &&
                profesionales.length > 0
            ) {

                const profesional =
                    profesionales[0];


                medico =
                    `${profesional.nombres} ${profesional.apellidos}`;


                // ==========================================
                // BUSCAR ESPECIALIDAD
                // ==========================================

                if (
                    profesional.especialidad_id
                ) {

                    const especialidades =
                        await supabaseGet(
                            "especialidades",
                            `?select=*&id=eq.${profesional.especialidad_id}`
                        );


                    if (
                        especialidades &&
                        especialidades.length > 0
                    ) {

                        especialidad =
                            especialidades[0].nombre;
                    }
                }
            }
        }


        // ==========================================
        // FECHA
        // ==========================================

        const fecha =
            atencion.fecha_hora
                ? new Date(
                    atencion.fecha_hora
                ).toLocaleString("es-PE")
                : "Fecha no registrada";


        // ==========================================
        // CREAR TARJETA
        // ==========================================

        const item =
            document.createElement(
                "div"
            );

        item.classList.add(
            "history-item"
        );


        item.innerHTML = `
            <h3>
                Atención del ${fecha}
            </h3>

            <p>
                <strong>Médico:</strong>
                ${medico}
            </p>

            <p>
                <strong>Especialidad:</strong>
                ${especialidad}
            </p>

            <p>
                <strong>Diagnóstico:</strong>
                ${atencion.diagnostico || "No registrado"}
            </p>

            <p>
                <strong>Tratamiento:</strong>
                ${atencion.tratamiento || "No registrado"}
            </p>
        `;


        contenedor.appendChild(
            item
        );
    }
}


// ==========================================
// ESTABLECER TEXTO
// ==========================================

function establecerTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.textContent =
            texto;
    }
}




       document.addEventListener('DOMContentLoaded', () => {
            const dniInput = document.getElementById('dni');
            const dniCounter = document.getElementById('dniCounter');
            const historyForm = document.getElementById('historyForm');
            const historyResult = document.getElementById('historyResult');
            const emptyHistoryState = document.getElementById('emptyHistoryState');
            const messageEl = document.getElementById('message');
            const btnSubmit = document.getElementById('btnSubmitHistory');
            const btnSpinner = document.getElementById('btnSpinner');
            const btnIcon = document.getElementById('btnIcon');
            const btnText = document.getElementById('btnText');

            // 1. Contador de caracteres en tiempo real y sólo dígitos
            if (dniInput) {
                dniInput.addEventListener('input', () => {
                    dniInput.value = dniInput.value.replace(/\D/g, '').slice(0, 8);
                    if (dniCounter) {
                        dniCounter.textContent = `${dniInput.value.length}/8 dígitos`;
                    }
                });
            }

            // 2. Observer para sincronizar el estado vacío con la visibilidad de #historyResult
            if (historyResult && emptyHistoryState) {
                const observer = new MutationObserver(() => {
                    const isHidden = historyResult.classList.contains('hidden');
                    emptyHistoryState.style.display = isHidden ? 'block' : 'none';

                    // Actualizar avatar e iniciales si existe paciente renderizado
                    const nameContainer = historyResult.querySelector('.patient-info strong');
                    if (nameContainer && document.getElementById('patientFullName')) {
                        const nameText = nameContainer.textContent.trim();
                        document.getElementById('patientFullName').textContent = nameText;
                        const initials = nameText.split(' ').map(n => n[0]).slice(0, 2).join('');
                        document.getElementById('patientAvatar').textContent = initials || 'PX';
                    }
                });

                observer.observe(historyResult, { attributes: true, attributeFilter: ['class'] });
            }

            // 3. Filtro interactivo de la línea de tiempo
            const filterChips = document.querySelectorAll('.filter-chip');
            filterChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');

                    const filter = chip.dataset.filter;
                    const records = document.querySelectorAll('.medical-record');

                    records.forEach(rec => {
                        const spec = rec.dataset.specialty || '';
                        if (filter === 'all' || spec.includes(filter)) {
                            rec.style.display = '';
                        } else {
                            rec.style.display = 'none';
                        }
                    });
                });
            });

            // 4. Fallback de respuesta visual en submit
            if (historyForm) {
                historyForm.addEventListener('submit', () => {
                    if (dniInput && dniInput.value.trim().length === 8) {
                        if (btnSpinner && btnIcon && btnText) {
                            btnSubmit.disabled = true;
                            btnSpinner.style.display = 'block';
                            btnIcon.style.display = 'none';
                            btnText.textContent = 'Buscando...';

                            setTimeout(() => {
                                btnSubmit.disabled = false;
                                btnSpinner.style.display = 'none';
                                btnIcon.style.display = 'inline-block';
                                btnText.textContent = 'Consultar historial';
                            }, 800);
                        }
                    }
                });
            }
        });

        // Utilidad rápida para testear DNI
        function quickSearch(dniValue) {
            const dniInput = document.getElementById('dni');
            const historyForm = document.getElementById('historyForm');
            if (dniInput && historyForm) {
                dniInput.value = dniValue;
                dniInput.dispatchEvent(new Event('input'));
                historyForm.dispatchEvent(new Event('submit'));
            }
        }

        // Copiar DNI al portapapeles
        function copyPatientDni() {
            const dniText = document.getElementById('patientDniText');
            const val = dniText ? dniText.textContent.trim() : document.getElementById('dni').value;
            if (val) {
                const tempInput = document.createElement('input');
                tempInput.value = val;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);

                const messageEl = document.getElementById('message');
                if (messageEl) {
                    messageEl.className = 'info';
                    messageEl.textContent = `DNI ${val} copiado al portapapeles.`;
                    messageEl.style.display = 'flex';
                    setTimeout(() => { messageEl.style.display = 'none'; }, 2200);
                }
            }
        }