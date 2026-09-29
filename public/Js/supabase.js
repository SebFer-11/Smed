const SUPABASE_URL = "https://czafdbsfagyewfhvujjk.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_wFP8zlLKA8rs-LS5RglnCA_IfG6TVaM";

async function supabaseGet(tabla, query = "") {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabla}${query}`,
        {
            method: "GET",

            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {

        const error = await response.text();

        throw new Error(
            `Error al consultar ${tabla}: ${error}`
        );
    }

    return await response.json();
}


async function supabasePost(tabla, datos) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabla}`,
        {
            method: "POST",

            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },

            body: JSON.stringify(datos)
        }
    );

    if (!response.ok) {

        const error = await response.text();

        throw new Error(
            `Error al insertar en ${tabla}: ${error}`
        );
    }

    return await response.json();
}


async function supabasePatch(tabla, query, datos) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabla}${query}`,
        {
            method: "PATCH",

            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },

            body: JSON.stringify(datos)
        }
    );

    if (!response.ok) {

        const error = await response.text();

        throw new Error(
            `Error al actualizar ${tabla}: ${error}`
        );
    }

    return await response.json();
}


async function supabaseDelete(tabla, query) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabla}${query}`,
        {
            method: "DELETE",

            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {

        const error = await response.text();

        throw new Error(
            `Error al eliminar de ${tabla}: ${error}`
        );
    }

    return true;
}