require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Middleware de Logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const probarConexion = async () => {
    const { data, error } = await supabase.from('reparaciones').select('id').limit(1);
    if (error) {
        console.error("❌ ERROR DE CONEXIÓN:", error.message);
    } else {
        console.log("✅ CONEXIÓN EXITOSA");
    }
};
probarConexion();

// 1. DASHBOARD
app.get('/api/dashboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reparaciones')
            .select(`
                id, 
                estado, 
                descripcion_falla, 
                precio_repuesto, 
                diagnostico_tecnico, 
                costo_estimado, 
                fecha_inicio,
                equipos!reparaciones_equipo_id_fkey (
                    marca, 
                    modelo, 
                    cliente:clientes!equipos_cliente_id_fkey (
                        nombre,
                        cedula,
                        telefono
                    )
                )
            `).order('fecha_inicio', { ascending: false });

        if (error) return res.status(400).json(error);
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: "Error interno" });
    }
});

// 2. ACTUALIZAR
app.put('/api/reparaciones/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    const cleanId = id.trim();

    try {
        // Sanitizar los campos que vamos a permitir actualizar
        const allowed = ['diagnostico_tecnico', 'costo_estimado', 'estado', 'fecha_fin', 'descripcion_falla', 'precio_repuesto'];
        const payload = Object.fromEntries(Object.entries(datos || {}).filter(([k]) => allowed.includes(k)));

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }

        const { data, error } = await supabase
            .from('reparaciones')
            .update(payload)
            .eq('id', cleanId)
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error("❌ ERROR EN /api/reparaciones/:id (PUT):", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * ELIMINAR REGISTRO: Elimina una reparación por su ID.
 * Se realiza una limpieza del ID para asegurar la consistencia.
 */
app.delete('/api/reparaciones/:id', async (req, res) => {
    const { id } = req.params;
    const cleanId = id.trim();
    try {
        const { data, error } = await supabase
            .from('reparaciones')
            .delete()
            .eq('id', cleanId);

        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, data });
    } catch (err) {
        console.error("❌ ERROR EN /api/reparaciones/:id (DELETE):", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * FINANZAS DIARIAS: Calcula el total recaudado por día para reparaciones 'Entregado'.
 * Agrupa manualmente los datos para evitar problemas de zona horaria y asegurar precisión.
 */
app.get('/api/finanzas/diarias', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reparaciones')
            .select('fecha_inicio, costo_estimado, estado')
            .eq('estado', 'Entregado'); // Solo sumamos lo efectivamente cobrado

        if (error) throw error;

        // Agrupamos manualmente para evitar errores de zona horaria
        const reporte = data.reduce((acc, curr) => {
            // Si el campo es DATE o TIMESTAMP, extraemos solo YYYY-MM-DD
            const fecha = curr.fecha_inicio.split('T')[0];

            if (!acc[fecha]) {
                acc[fecha] = {
                    fecha_cierre: fecha,
                    cant_entregas: 0,
                    total_recaudado: 0
                };
            }

            acc[fecha].cant_entregas += 1;
            acc[fecha].total_recaudado += Number(curr.costo_estimado || 0);

            return acc;
        }, {});

        // Ordenamos por fecha para que aparezcan todos los días (13, 14, etc)
        const resultado = Object.values(reporte).sort((a, b) =>
            b.fecha_cierre.localeCompare(a.fecha_cierre)
        );

        res.json(resultado);
    } catch (err) {
        console.error("❌ ERROR EN /api/finanzas/diarias:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/** 
 * REGISTRO INTEGRAL: Maneja la creación en cascada (Cliente -> Equipo -> Reparación).
 * Incluye lógica para buscar/crear cliente, insertar equipo y luego la reparación.
 * Normaliza la fecha local para evitar desfases de zona horaria en el registro.
 */
app.post('/api/registro-total', async (req, res) => {
    const datos = req.body;
    try {
        // Sanitización y normalización de datos de entrada
        const cedulaS = String(datos.cedula || '').trim();
        const nombreS = String(datos.nombre || '').trim();
        const telefonoS = String(datos.telefono || '').trim();
        const emailS = String(datos.email || datos.correo || '').toLowerCase().trim();
        const costoSeguro = parseFloat(datos.costo_estimado || datos.costo || 0);
        const precioRepuesto = parseFloat(datos.precio_repuesto || datos.costo_repuesto || datos.precio || 0);

        if (!cedulaS) throw new Error("La cédula es obligatoria");

        // 1. Gestión de Cliente (Busca existente o crea uno nuevo)
        let clienteFinal;
        const { data: clienteExistente, error: errorBusqueda } = await supabase
            .from('clientes')
            .select('*')
            .eq('cedula', cedulaS)
            .maybeSingle();

        if (errorBusqueda) throw errorBusqueda;

        if (clienteExistente) {
            // Actualiza datos del cliente si ya existe
            const { data: cUpd, error: errorUpdate } = await supabase
                .from('clientes')
                .update({ nombre: nombreS, telefono: telefonoS, email: emailS })
                .eq('id', clienteExistente.id)
                .select().single();
            if (errorUpdate) throw errorUpdate;
            clienteFinal = cUpd;
        } else {
            // Crea un nuevo cliente
            const { data: cNew, error: errorInsertCli } = await supabase
                .from('clientes')
                .insert([{ cedula: cedulaS, nombre: nombreS, telefono: telefonoS, email: emailS }])
                .select().single();
            if (errorInsertCli) throw errorInsertCli;
            clienteFinal = cNew;
        }

        if (!clienteFinal) throw new Error("Error al gestionar el cliente.");

        // 2. Insertar Equipo asociado al cliente
        const { data: nEquipo, error: errorInsertEq } = await supabase
            .from('equipos')
            .insert([{
                tipo: datos.tipo_dispositivo || datos.tipo || 'Otro',
                marca: String(datos.marca || '').trim(),
                modelo: String(datos.modelo || '').trim(),
                cliente_id: clienteFinal.id
            }])
            .select().single();

        if (errorInsertEq) throw errorInsertEq;
        if (!nEquipo) throw new Error("Error al registrar el equipo.");

        // --- CORRECCIÓN DE FECHA ---
        const hoy = new Date();
        const fechaLocal = hoy.getFullYear() + '-' +
            String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoy.getDate()).padStart(2, '0');

        // 3. Insertar Reparación vinculada al equipo
        const { data: nRep, error: errorInsertRep } = await supabase
            .from('reparaciones')
            .insert([{
                descripcion_falla: String(datos.descripcion_falla || datos.falla || 'Sin descripción').trim(),
                costo_estimado: costoSeguro,
                precio_repuesto: precioRepuesto,
                estado: datos.estado || 'Pendiente',
                equipo_id: nEquipo.id,
                fecha_inicio: fechaLocal
            }])
            .select().single();

        if (errorInsertRep) throw errorInsertRep;

        res.json({ success: true, data: nRep });

    } catch (err) {
        console.error("❌ ERROR EN /api/registro-total:", err.message);
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));