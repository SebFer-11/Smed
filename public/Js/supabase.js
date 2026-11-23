
const SUPABASE_URL = "https://czafdbsfagyewfhvujjk.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_wFP8zlLKA8rs-LS5RglnCA_IfG6TVaM";

const SUPABASE_SCHEMA = "public";

// ========================================
// FUNCIÓN GENERAL PARA REALIZAR PETICIONES
// ========================================

async function supabaseRequest(tabla, options = {}, query = "") {

    const {
        method = "GET",
        body = null,
        prefer = null
    } = options;

    const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };

    // Especificar explícitamente el esquema
    if (method === "GET" || method === "HEAD") {
        headers["Accept-Profile"] = SUPABASE_SCHEMA;
    } else {
        headers["Content-Profile"] = SUPABASE_SCHEMA;
    }

    if (prefer) {
        headers["Prefer"] = prefer;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tabla)}${query}`,
            {
                method,
                headers,
                body: body !== null ? JSON.stringify(body) : null
            }
        );

        const responseText = await response.text();

        if (!response.ok) {

            let errorData;

            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = responseText;
            }

            console.error("Error de Supabase:", {
                tabla,
                metodo: method,
                status: response.status,
                error: errorData
            });

            throw new Error(
                `Error en ${method} ${tabla}: ${
                    typeof errorData === "object"
                        ? JSON.stringify(errorData)
                        : errorData
                }`
            );
        }

        // Algunas operaciones pueden no devolver contenido
        if (!responseText) {
            return null;
        }

        return JSON.parse(responseText);

    } catch (error) {

        console.error(`Error en supabaseRequest (${method}):`, error);

        throw error;
    }
}


// ========================================
// CONSULTAR REGISTROS (GET)
// ========================================

async function supabaseGet(tabla, query = "") {

    return await supabaseRequest(
        tabla,
        {
            method: "GET"
        },
        query
    );
}


// ========================================
// INSERTAR REGISTROS (POST)
// ========================================

async function supabasePost(tabla, datos) {

    return await supabaseRequest(
        tabla,
        {
            method: "POST",
            body: datos,
            prefer: "return=representation"
        }
    );
}


// ========================================
// ACTUALIZAR REGISTROS (PATCH)
// ========================================

async function supabasePatch(tabla, query, datos) {

    return await supabaseRequest(
        tabla,
        {
            method: "PATCH",
            body: datos,
            prefer: "return=representation"
        },
        query
    );
}


// ========================================
// ELIMINAR REGISTROS (DELETE)
// ========================================

async function supabaseDelete(tabla, query) {

    await supabaseRequest(
        tabla,
        {
            method: "DELETE"
        },
        query
    );

    return true;
}
