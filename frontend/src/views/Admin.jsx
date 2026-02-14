import { useEffect, useState, useMemo } from 'react';
import { tallerService } from '../api/tallerService';
import RegistroForm from '../components/RegistroForm';

// ... (DashboardResumenHoy y SeccionFinanzas se mantienen igual)

export default function Admin() {
    const [reps, setReps] = useState([]); 
    const [filtro, setFiltro] = useState('');
    const [pestana, setPestana] = useState('taller');

    // 1. CARGA Y LIMPIEZA DE DATOS (Aplanamiento)
    const load = async () => {
        try {
            const data = await tallerService.getDashboard();
            if (Array.isArray(data)) {
                // Aquí "aplanamos" los datos para que no se crucen los nombres
                const datosLimpios = data.map(r => {
                    const eq = r.equipos || r['equipos!reparaciones_equipo_id_fkey'] || r['equipos!fk_equipo'] || {};
                    const cli = eq.cliente || eq.clientes || eq['clientes!equipos_cliente_id_fkey'] || eq['clientes!fk_cliente'] || {};
                    
                    return {
                        ...r,
                        // Creamos propiedades directas para evitar confusiones en el render
                        displayNombre: cli.nombre || 'Sin nombre',
                        displayCedula: cli.cedula || '---',
                        displayMarca: eq.marca || 'Genérico',
                        displayModelo: eq.modelo || ''
                    };
                });
                setReps(datosLimpios);
            }
        } catch (error) { console.error("Error:", error); }
    };

    useEffect(() => { load(); }, []);

    // 2. FILTRADO BASADO EN LOS DATOS LIMPIOS
    const reparacionesFiltradas = useMemo(() => {
        const search = filtro.toLowerCase();
        return reps.filter(r => 
            r.displayNombre.toLowerCase().includes(search) || 
            r.displayCedula.toLowerCase().includes(search) ||
            r.displayMarca.toLowerCase().includes(search)
        );
    }, [reps, filtro]);

    // 3. ACTUALIZACIÓN DE ESTADO
    const handleEstado = async (id, nuevoEstado) => {
        try {
            const dataUpdate = { 
                estado: nuevoEstado,
                fecha_fin: nuevoEstado === 'Entregado' ? new Date().toISOString().split('T')[0] : null 
            };
            await tallerService.actualizarReparacion(id, dataUpdate);
            await load(); 
        } catch (error) { alert("Error al actualizar"); }
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit font-black text-xs uppercase">
                <button onClick={() => setPestana('taller')} className={`px-8 py-2.5 rounded-xl transition-all ${pestana === 'taller' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>⚙️ Gestión Taller</button>
                <button onClick={() => setPestana('finanzas')} className={`px-8 py-2.5 rounded-xl transition-all ${pestana === 'finanzas' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>💰 Finanzas Admin</button>
            </div>

            <div className="max-w-7xl mx-auto">
                {pestana === 'taller' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                        <div className="space-y-6">
                            <RegistroForm onRefresh={load} />
                            <DashboardResumenHoy reparaciones={reps} />
                        </div>
                        
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">
                                <span className="text-slate-400">🔍</span>
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre, cédula o marca..." 
                                    className="w-full outline-none text-sm" 
                                    value={filtro} 
                                    onChange={(e) => setFiltro(e.target.value)} 
                                />
                            </div>

                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b">
                                        <tr><th className="p-4">Cliente</th><th className="p-4">Equipo</th><th className="p-4">Falla / Diagnóstico</th><th className="p-4 text-center">Costo</th><th className="p-4 text-center">Estado</th></tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reparacionesFiltradas.map(r => (
                                            <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{r.displayNombre}</span>
                                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1 w-fit">
                                                            CC: {r.displayCedula}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-slate-700">
                                                    {r.displayMarca} <span className="text-slate-400">{r.displayModelo}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] italic text-slate-400">"{r.descripcion_falla}"</p>
                                                        <EditableDiagnostico id={r.id} valorInicial={r.diagnostico_tecnico} onSave={load} />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <EditableCosto id={r.id} valorInicial={r.costo_estimado} onSave={load} />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <select 
                                                        value={r.estado} 
                                                        onChange={(e) => handleEstado(r.id, e.target.value)} 
                                                        className={`text-[10px] font-black px-3 py-1 rounded-full outline-none cursor-pointer transition-colors ${r.estado === 'Entregado' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-700'}`}
                                                    >
                                                        <option value="Pendiente">PENDIENTE</option>
                                                        <option value="En Proceso">EN PROCESO</option>
                                                        <option value="Reparado">REPARADO</option>
                                                        <option value="Entregado">ENTREGADO</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <SeccionFinanzas reparaciones={reps} />
                )}
            </div>
        </div>
    );
}