import { useEffect, useState, useMemo } from 'react';
import { tallerService } from '../api/tallerService';
import RegistroForm from '../components/RegistroForm';
import DashboardResumenHoy from '../components/DashboardResumenHoy';
import SeccionFinanzas from '../components/SeccionFinanzas';
import { EditableDiagnostico, EditableCosto, EditableRepuesto } from '../components/EditableCells';

/** 
 * VISTA ADMINISTRATIVA PRINCIPAL
 * Orquesta la gestión del taller, el filtrado de registros y la navegación hacia finanzas.
 */
export default function Admin() {
    const [reps, setReps] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [pestana, setPestana] = useState('taller');

    /** 
     * CARGA Y NORMALIZACIÓN DE DATOS
     * Se procesa la respuesta del backend para aplanar las relaciones (cliente y equipo)
     * facilitando el renderizado y el filtrado instantáneo.
     */
    const load = async () => {
        try {
            const res = await tallerService.getDashboard();

            if (Array.isArray(res)) {
                const datosNormalizados = res.map(r => {
                    const eq = r.equipos || {};
                    const cli = eq.cliente || {};
                    return {
                        ...r,
                        nombre_render: cli.nombre || 'Sin nombre',
                        cedula_render: cli.cedula || 'S/N',
                        marca_render: eq.marca || '---',
                        modelo_render: eq.modelo || '---'
                    };
                });
                setReps(datosNormalizados);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    useEffect(() => { load(); }, []);

    /** 
     * FILTRADO EN TIEMPO REAL
     * Utiliza useMemo para optimizar el rendimiento al buscar entre grandes volúmenes de datos.
     * Busca coincidencias en nombre, cédula, marca y modelo.
     */
    const reparacionesFiltradas = useMemo(() => {
        const search = (filtro || '').toLowerCase().trim();
        if (!search) return reps;

        return reps.filter(r => {
            const nombre = String(r.nombre_render || '').toLowerCase();
            const cedula = String(r.cedula_render || '').toLowerCase();
            const marca = String(r.marca_render || '').toLowerCase();
            const modelo = String(r.modelo_render || '').toLowerCase();

            return (
                nombre.includes(search) ||
                cedula.includes(search) ||
                marca.includes(search) ||
                modelo.includes(search)
            );
        });
    }, [reps, filtro]);

    // --- 3. MANEJO DE ESTADO ---
    const handleEstado = async (id, nuevoEstado) => {
        try {
            if (!id) return alert("ID de reparación no encontrado");
            const hoy = new Date();
            const fechaLocal = hoy.getFullYear() + '-' +
                String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                String(hoy.getDate()).padStart(2, '0');

            const dataUpdate = {
                estado: nuevoEstado,
                fecha_fin: nuevoEstado === 'Entregado' ? fechaLocal : null
            };
            await tallerService.actualizarReparacion(id, dataUpdate);
            await load();
        } catch (error) {
            console.error("Error al actualizar estado:", error);
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta reparación? No se puede deshacer.")) return;
        try {
            await tallerService.eliminarReparacion(id);
            await load();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };

    const updateRepuestoLocal = (id, value) => {
        setReps(prev => prev.map(r => r.id === id ? { ...r, precio_repuesto: value, costo_repuesto: value } : r));
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Menú de Pestañas */}
            <div className="mx-auto flex gap-[10px] py-4 bg-slate-200/50 p-1.5 w-fit font-black text-xs uppercase sticky top-0 z-50">
                <button onClick={() => setPestana('taller')} className={`px-8 py-2.5 rounded-2xl transition-all border border-slate-200 ${pestana === 'taller' ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-50 text-slate-500'}`}>⚙️ Gestión Taller</button>
                <button onClick={() => setPestana('finanzas')} className={`px-8 py-2.5 rounded-2xl transition-all border border-slate-200 ${pestana === 'finanzas' ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-50 text-slate-500'}`}>💰 Finanzas Admin</button>
            </div>

            <div className="w-full">
                {pestana === 'taller' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-500 pb-10">
                        <div className="lg:col-span-3 space-y-5">
                            <RegistroForm onRefresh={load} />
                            <DashboardResumenHoy reparaciones={reps} />
                        </div>

                        <div className="lg:col-span-9 space-y-4">
                            {/* Buscador */}
                            <div className="bg-white p-3 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
                                <span className="text-slate-400 text-sm">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente, cédula o equipo..."
                                    className="w-full outline-none text-xs text-slate-600 font-medium"
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                />
                            </div>

                            {/* Tabla con Datos Normalizados */}
                            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs min-w-[900px]">
                                        <thead className="bg-slate-50 text-[12px] uppercase font-bold text-slate-400 border-b">
                                            <tr>
                                                <th className="p-3">Cliente</th>
                                                <th className="p-3">Equipo</th>
                                                <th className="p-3">Falla / Diagnóstico</th>
                                                <th className="p-3 text-center">Costo</th>
                                                <th className="p-3 text-center">Precio Repuesto</th>
                                                <th className="p-3 text-center text-blue-500">Total Ganancia</th>
                                                <th className="p-3 text-center">Estado</th>
                                                <th className="p-3 text-center text-red-400">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reparacionesFiltradas.map(r => (
                                                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 leading-tight">{r.nombre_render}</span>
                                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 w-fit">
                                                                CC: {r.cedula_render}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-medium text-slate-700">
                                                        {r.marca_render} <div className="text-slate-400 text-[9px]">{r.modelo_render}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[13px] italic text-slate-400">"{r.descripcion_falla}"</p>
                                                            <EditableDiagnostico id={r.id} valorInicial={r.diagnostico_tecnico} onSave={load} />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center ">
                                                        <EditableCosto id={r.id} valorInicial={r.costo_estimado} onSave={load} />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <EditableRepuesto id={r.id} valorInicial={r.precio_repuesto ?? r.costo_repuesto} onSave={(id, val) => { updateRepuestoLocal(id, val); }} />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {(() => {
                                                            const costo = parseFloat(r.costo_estimado) || 0;
                                                            const precioRepuestoRaw = r.precio_repuesto ?? r.costo_repuesto;
                                                            if (precioRepuestoRaw === null || precioRepuestoRaw === undefined) {
                                                                return <span className="text-slate-400 font-black">---</span>;
                                                            }
                                                            const repuesto = parseFloat(precioRepuestoRaw) || 0;
                                                            const ganancia = costo - repuesto;
                                                            const className = ganancia < 0 ? 'text-red-600 font-black' : 'text-green-700 font-black';
                                                            return <span className={className}>${ganancia.toLocaleString('es-CO')}</span>;
                                                        })()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <select
                                                            value={r.estado}
                                                            onChange={(e) => handleEstado(r.id, e.target.value)}
                                                            className={`text-[12px] font-black uppercase px-3 py-1.5 rounded-lg border-2 ${r.estado === 'Entregado' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                r.estado === 'En Reparación' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                                }`}
                                                        >
                                                            <option value="Recibido">Recibido</option>
                                                            <option value="En Reparación">En Reparación</option>
                                                            <option value="Listo">Listo</option>
                                                            <option value="Entregado">Entregado</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleEliminar(r.id)}
                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors group"
                                                            title="Eliminar Registro"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <SeccionFinanzas reparaciones={reps} load={load} />
                )}
            </div>
        </div>
    );
}