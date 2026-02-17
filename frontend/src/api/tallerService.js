const API_URL = import.meta.env.VITE_API_URL;

export const tallerService = {
    getDashboard: async () => {
        const res = await fetch(`${API_URL}/dashboard`);
        if (!res.ok) throw new Error("Error cargando dashboard");
        return res.json();
    },

    async registrar(datos) {
        const response = await fetch(`${API_URL}/registro-total`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: "Error en el registro"
            }));
            throw new Error(errorData.error || "Fallo en el servidor");
        }

        return await response.json();
    },

    actualizarReparacion: async (id, datos) => {
        const res = await fetch(`${API_URL}/reparaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Error al actualizar");
        }
        return res.json();
    },

    eliminarReparacion: async (id) => {
        const url = `${API_URL}/reparaciones/${id}`;
        console.log(`Intentando eliminar: DELETE ${url}`);

        try {
            const res = await fetch(url, { method: 'DELETE' });
            const contentType = res.headers.get("content-type");

            if (!res.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Error ${res.status}`);
                } else {
                    const text = await res.text();
                    console.error("Respuesta de error no-JSON:", text.substring(0, 200));
                    throw new Error(`Servidor devolvió HTML/Texto (${res.status}). Revisa la consola del backend.`);
                }
            }

            // Si es 200 OK, intentar parsear JSON
            if (contentType && contentType.includes("application/json")) {
                return await res.json();
            } else {
                return { success: true }; // Si no es JSON pero es OK
            }
        } catch (err) {
            console.error("Fallo en fetch eliminarReparacion:", err);
            throw err;
        }
    }
};