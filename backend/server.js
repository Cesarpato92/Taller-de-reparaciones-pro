require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// --- CONFIGURACIÓN VITAL ---
// Estas líneas DEBEN ir antes de las rutas
app.use(cors());
app.use(express.json()); 

// server.js
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

// Añade esto para probar la conexión apenas inicies el servidor
const probarConexion = async () => {
    const { data, error } = await supabase.from('reparaciones').select('id').limit(1);
    if (error) {
        console.error("❌ ERROR DE CONEXIÓN:", error.message);
    } else {
        console.log("✅ CONEXIÓN EXITOSA: El servidor ve la tabla 'reparaciones'");
    }
};
probarConexion();

// 1. DASHBOARD (Lectura) - LIMPIO DE COMENTARIOS INTERNOS
app.get('/api/dashboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reparaciones')
            .select(`
                id, 
                estado, 
                descripcion_falla, 
                diagnostico_tecnico, 
                costo_estimado, 
                equipos!fk_equipo (
                    marca, 
                    modelo, 
                    clientes!equipos_cliente_id_fkey (
                        nombre,
                        cedula,
                        telefono
                    )
                )
            `);
        if (error) {
            console.error("Error en query dashboard:", error);
            return res.status(400).json(error);
        }
        res.json(data || []);
    } catch (err) {
        console.error("Error interno:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
// 2. ACTUALIZAR (Aquí estaba el probable fallo)
app.put('/api/reparaciones/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body;

    // 1. Limpieza extrema del ID
    const cleanId = id.trim();

    console.log(`--- INTENTO DE UPDATE ---`);
    console.log(`ID original: "${id}" (Longitud: ${id.length})`);
    console.log(`ID limpio: "${cleanId}"`);
    console.log(`Datos:`, datos);

    // 2. Ejecutar Update
    const { data, error } = await supabase
        .from('reparaciones')
        .update(datos)
        .eq('id', cleanId) // Usamos el ID limpio
        .select();

    if (error) {
        console.error("❌ Error de Supabase:", error.message);
        return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
        console.warn("⚠️ Advertencia: No se encontró la fila. El ID enviado no coincide con ningún registro.");
        return res.status(404).json({ message: "No se encontró el registro", id_buscado: cleanId });
    }

    console.log("✅ Fila actualizada correctamente:", data[0]);
    res.json(data);
});



// 3. REGISTRO TOTAL (Actualizado con Lógica de Búsqueda y Actualización)
app.post('/api/registro-total', async (req, res) => {
    const datos = req.body; 
    console.log("--- PROCESANDO REGISTRO INTELIGENTE ---");

    try {
        // --- 1. NORMALIZACIÓN Y LIMPIEZA DE DATOS ---
        // Extraemos campos buscando nombres alternativos por si vienen del frontend de distintas formas
        const cedulaS = String(datos.cedula || '').trim();
        const nombreS = String(datos.nombre || '').trim();
        const telefonoS = String(datos.telefono || '').trim();
        const emailS = String(datos.email || datos.correo || '').toLowerCase().trim();
        const costoSeguro = parseFloat(datos.costo_estimado || datos.costo || 0);

        if (!cedulaS) throw new Error("La cédula es obligatoria para verificar al cliente");

        // --- 2. GESTIÓN DE CLIENTE (Búsqueda o Creación) ---
        let clienteFinal;

        // Primero verificamos si el cliente ya existe por su cédula
        const { data: clienteExistente, error: errorBusqueda } = await supabase
            .from('clientes')
            .select('*')
            .eq('cedula', cedulaS)
            .maybeSingle();

        if (clienteExistente) {
            // SI EXISTE: Actualizamos sus datos (nombre, tel, email) por si cambiaron
            console.log(`🔄 Cliente encontrado (ID: ${clienteExistente.id}). Actualizando datos...`);
            const { data: clienteActualizado, error: errorUpdate } = await supabase
                .from('clientes')
                .update({ nombre: nombreS, telefono: telefonoS, email: emailS })
                .eq('id', clienteExistente.id)
                .select().single();
            
            if (errorUpdate) throw errorUpdate;
            clienteFinal = clienteActualizado;
        } else {
            // NO EXISTE: Creamos el nuevo cliente
            console.log("✨ Cliente nuevo. Creando registro...");
            const { data: nuevoCliente, error: errorInsert } = await supabase
                .from('clientes')
                .insert([{ cedula: cedulaS, nombre: nombreS, telefono: telefonoS, email: emailS }])
                .select().single();

            if (errorInsert) throw errorInsert;
            clienteFinal = nuevoCliente;
        }

        // --- 3. INSERTAR EQUIPO (Siempre creamos una nueva entrada de equipo para la ficha) ---
        const { data: nEquipo, error: e2 } = await supabase
            .from('equipos')
            .insert([{ 
                tipo: datos.tipo_dispositivo || datos.tipo || 'Otro', 
                marca: String(datos.marca || '').trim(), 
                modelo: String(datos.modelo || '').trim(),
                cliente_id: clienteFinal.id 
            }])
            .select().single();

        if (e2) {
            console.error("Error al crear equipo:", e2.message);
            throw e2;
        }

        // --- 4. INSERTAR REPARACIÓN ---
        const { data: nRep, error: e3 } = await supabase
            .from('reparaciones')
            .insert([{ 
                descripcion_falla: String(datos.descripcion_falla || datos.falla || 'Sin descripción').trim(), 
                costo_estimado: costoSeguro,
                estado: 'Pendiente',
                fk_equipo: nEquipo.id, 
                fecha_inicio: new Date().toISOString()
            }])
            .select().single();

        if (e3) {
            console.error("Error al crear reparación:", e3.message);
            throw e3;
        }

        console.log("✅ Proceso completado exitosamente");
        res.json({ success: true, data: nRep });

    } catch (err) {
        console.error("❌ ERROR EN EL SERVIDOR:", err.message);
        // Enviamos el error 400 pero con un mensaje claro que React pueda mostrar
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));