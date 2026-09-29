const searchForm =
    document.getElementById("searchForm");

const patientResult =
    document.getElementById("patientResult");

const message =
    document.getElementById("message");


// ==========================================
// BUSCAR PACIENTE
// ==========================================

searchForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const type =
            document.getElementById(
                "searchType"
            ).value;

        const value =
            document.getElementById(
                "searchValue"
            ).value.trim();


        // ==========================================
        // VALIDAR VALOR
        // ==========================================

        if (value === "") {

            patientResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ingrese un valor para realizar la búsqueda.";

            message.style.color =
                "red";

            return;
        }


        // ==========================================
        // VALIDAR DNI
        // ==========================================

        if (
            type === "dni" &&
            !/^\d{8}$/.test(value)
        ) {

            patientResult.classList.add(
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
            // PREPARAR CONSULTA
            // ==========================================

            let columna;

            if (type === "dni") {

                columna = "dni";

            } else if (
                type === "historia_clinica"
            ) {

                columna =
                    "historia_clinica";

            } else {

                message.textContent =
                    "Tipo de búsqueda no válido.";

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // CONSULTAR SUPABASE
            // ==========================================

            const pacientes =
                await supabaseGet(
                    "pacientes",
                    `?select=*&${columna}=eq.${encodeURIComponent(value)}`
                );


            // ==========================================
            // PACIENTE NO ENCONTRADO
            // ==========================================

            if (
                !pacientes ||
                pacientes.length === 0
            ) {

                patientResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    `No se encontró un paciente utilizando ${type}.`;

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // PACIENTE ENCONTRADO
            // ==========================================

            const paciente =
                pacientes[0];


            mostrarPaciente(
                paciente
            );


            patientResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Paciente encontrado.";

            message.style.color =
                "green";


        } catch (error) {

            console.error(
                "Error al consultar paciente:",
                error
            );

            patientResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar el paciente.";

            message.style.color =
                "red";
        }
    }
);


// ==========================================
// MOSTRAR PACIENTE
// ==========================================

function mostrarPaciente(
    paciente
) {

    // ==========================================
    // NOMBRE
    // ==========================================

    const nombre =
        `${paciente.nombres || ""} ` +
        `${paciente.apellido_paterno || ""} ` +
        `${paciente.apellido_materno || ""}`.trim();


    establecerTexto(
        "nombrePaciente",
        nombre
    );


    // ==========================================
    // DNI
    // ==========================================

    establecerTexto(
        "dniPaciente",
        paciente.dni ||
        "No registrado"
    );


    // ==========================================
    // HISTORIA CLÍNICA
    // ==========================================

    establecerTexto(
        "historiaClinica",
        paciente.historia_clinica ||
        "No registrada"
    );


    // ==========================================
    // FECHA DE NACIMIENTO
    // ==========================================

    establecerTexto(
        "fechaNacimiento",
        formatearFecha(
            paciente.fecha_nacimiento
        )
    );


    // ==========================================
    // EDAD
    // ==========================================

    establecerTexto(
        "edadPaciente",
        calcularEdad(
            paciente.fecha_nacimiento
        )
    );


    // ==========================================
    // SEXO
    // ==========================================

    establecerTexto(
        "sexoPaciente",
        paciente.sexo ||
        "No registrado"
    );


    // ==========================================
    // DIRECCIÓN
    // ==========================================

    establecerTexto(
        "direccionPaciente",
        paciente.direccion ||
        "No registrada"
    );


    // ==========================================
    // TELÉFONO
    // ==========================================

    establecerTexto(
        "telefonoPaciente",
        paciente.telefono ||
        "No registrado"
    );


    // ==========================================
    // CORREO
    // ==========================================

    establecerTexto(
        "emailPaciente",
        paciente.email ||
        "No registrado"
    );


    // ==========================================
    // SIS
    // ==========================================

    establecerTexto(
        "codigoSIS",
        paciente.codigo_sis ||
        "No registrado"
    );


    establecerTexto(
        "estadoSIS",
        paciente.sis_estado ||
        "No registrado"
    );
}


// ==========================================
// ESTABLECER TEXTO SI EXISTE EL ELEMENTO
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


// ==========================================
// CALCULAR EDAD
// ==========================================

function calcularEdad(
    fechaNacimiento
) {

    if (!fechaNacimiento) {

        return "No registrada";
    }

    const nacimiento =
        new Date(fechaNacimiento);

    const hoy =
        new Date();

    let edad =
        hoy.getFullYear() -
        nacimiento.getFullYear();

    const mes =
        hoy.getMonth() -
        nacimiento.getMonth();


    if (
        mes < 0 ||
        (
            mes === 0 &&
            hoy.getDate() <
            nacimiento.getDate()
        )
    ) {

        edad--;
    }


    return `${edad} años`;
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "No registrada";
    }

    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;
    }


    return (
        `${partes[2]}/` +
        `${partes[1]}/` +
        `${partes[0]}`
    );
}