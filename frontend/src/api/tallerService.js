const API_URL = import.meta.env.VITE_API_URL;
//console.log("Conectando a:", API_URL);

export const tallerService = {
    getDashboard: async () => {
        const res = await fetch(`${API_URL}/dashboard`);
        return res.json();
    },

    async registrar(datos) {
        // Usamos API_URL para que coincida con el resto de tus funciones
        const response = await fetch(`${API_URL}/registro-total`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                error: "Ruta no encontrada o error de servidor" 
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
        return res.json();
    }
};