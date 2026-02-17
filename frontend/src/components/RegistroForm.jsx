import { useState } from 'react';
import { tallerService } from '../api/tallerService';
import { generarRecibo } from '../services/pdfGenerator';

/** 
 * COMPONENTE DE REGISTRO
 * Maneja el formulario de ingreso de equipos. 
 * Realiza una validación básica y envía los datos al backend en una sola transacción.
 */
export default function RegistroForm({ onRefresh }) {
    // 1. Agregamos cedula y email al estado inicial
    const [f, setF] = useState({
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        tipo: 'Celular',
        marca: '',
        modelo: '',
        falla: '',
        costo: '',
        precio_repuesto: '',
        estado: 'Pendiente'
    });

    const handle = async (e) => {
        e.preventDefault();
        try {
            const datosFinales = {
                ...f,
                costo: Number(f.costo) || 0,
                precio_repuesto: Number(f.precio_repuesto) || 0,
                // Mapeamos el campo 'falla' del formulario al campo
                // que espera el backend: 'descripcion_falla'
                descripcion_falla: f.falla
            };

            await tallerService.registrar(datosFinales);
            generarRecibo(f);

            // 2. Limpiamos también los campos nuevos
            setF({
                nombre: '', cedula: '', telefono: '', email: '',
                tipo: 'Celular', marca: '', modelo: '',
                falla: '', costo: '', precio_repuesto: '', estado: 'Pendiente'
            });

            onRefresh();
            alert("✅ Registrado con éxito");
        } catch (err) {
            console.error("Error al registrar:", err);
            alert("❌ Error al registrar.");
        }
    };

    return (
        <form onSubmit={handle} className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Nuevo Ingreso</h3>

            {/* --- SECCIÓN CLIENTE --- */}
            <input
                className="w-full p-2 bg-slate-50 rounded-lg border text-sm"
                placeholder="Nombre del Cliente"
                value={f.nombre}
                onChange={e => setF({ ...f, nombre: e.target.value })}
                required
            />

            <div className="flex gap-2">
                <input
                    className="w-1/2 p-2 bg-slate-50 rounded-lg border text-sm"
                    placeholder="Cédula / ID"
                    value={f.cedula}
                    onChange={e => setF({ ...f, cedula: e.target.value })}
                    required
                />
                <input
                    className="w-1/2 p-2 bg-slate-50 rounded-lg border text-sm"
                    placeholder="Teléfono"
                    value={f.telefono}
                    onChange={e => setF({ ...f, telefono: e.target.value })}
                    required
                />
            </div>

            <input
                type="email"
                className="w-full p-2 bg-slate-50 rounded-lg border text-sm"
                placeholder="Correo Electrónico"
                value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })}
            />

            <hr className="border-slate-100 my-2" />

            {/* --- SECCIÓN EQUIPO --- */}
            <div className="flex gap-2">
                <select className="w-1/3 p-2 bg-slate-50 rounded-lg border text-sm" value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })}>
                    <option value="Celular">Celular</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Otro">Otro</option>
                </select>
                <input className="w-1/3 p-2 bg-slate-50 rounded-lg border text-sm" placeholder="Marca" value={f.marca} onChange={e => setF({ ...f, marca: e.target.value })} />
                <input className="w-1/3 p-2 bg-slate-50 rounded-lg border text-sm" placeholder="Modelo" value={f.modelo} onChange={e => setF({ ...f, modelo: e.target.value })} />
            </div>

            {/* --- SECCIÓN REPARACIÓN --- */}
            <div className="relative">
                <span className="absolute left-2 top-2 text-slate-400 text-sm">$</span>
                <input
                    type="number"
                    className="w-full p-2 pl-6 bg-blue-50/50 border-blue-100 rounded-lg border text-sm font-bold text-blue-700 outline-none"
                    placeholder="Presupuesto (Mano de obra + Ganancia)"
                    value={f.costo}
                    onChange={e => setF({ ...f, costo: e.target.value })}
                />
            </div>
            <div className="relative">
                <span className="absolute left-2 top-2 text-slate-400 text-sm">$</span>
                <input
                    type="number"
                    className="w-full p-2 pl-6 bg-yellow-50/50 border-yellow-100 rounded-lg border text-sm font-bold text-amber-700 outline-none"
                    placeholder="Precio Repuesto (Costo) - Opcional"
                    value={f.precio_repuesto}
                    onChange={e => setF({ ...f, precio_repuesto: e.target.value })}
                />
            </div>
            <select
                className="w-full p-2 bg-slate-50 rounded-lg border text-sm font-medium"
                value={f.estado}
                onChange={e => setF({ ...f, estado: e.target.value })}
            >
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Reparado">Reparado</option>
            </select>

            <textarea
                className="w-full p-2 bg-slate-50 rounded-lg border text-sm"
                placeholder="Descripción de la falla o detalles"
                value={f.falla}
                onChange={e => setF({ ...f, falla: e.target.value })}
                required
            />

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]">
                REGISTRAR Y GENERAR RECIBO
            </button>
        </form>
    );
}