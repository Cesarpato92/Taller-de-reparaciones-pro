import { useEffect, useState, useMemo } from 'react';
import { tallerService } from '../api/tallerService';
import RegistroForm from '../components/RegistroForm';

// --- SUB-COMPONENTE DASHBOARD LATERAL CON LOGS ---
function DashboardResumenHoy({ reparaciones }) {
    const stats = useMemo(() => {
        const ahora = new Date();
        const hoyLocal = ahora.toISOString().split('T')[0];

        let montoHoy = 0;
        let entregadosHoy = 0;

        // 1. Filtrar y formatear con "Salvavidas" de fecha
        const todasEntregadas = (reparaciones || [])
            .filter(r => String(r.estado || "").trim().toLowerCase() === 'entregado')
            .map(r => {
                // SALVAVIDAS: Si no hay fecha_fin, asumimos hoy para que el balance no de $0
                const rawDate = r.fecha_fin || r.fecha_inicio || r.created_at || hoyLocal;
                const fechaValida = String(rawDate).trim().substring(0, 10);
                
                return {
                    ...r,
                    fechaLimpia: fechaValida,
                    montoNum: parseFloat(r.costo_estimado) || 0
                };
            });

        // 2. Calcular balance de HOY
        todasEntregadas.forEach(r => {
            if (r.fechaLimpia === hoyLocal) {
                montoHoy += r.montoNum;
                entregadosHoy += 1;
            }
        });

        const ultimas6 = [...todasEntregadas]
            .sort((a, b) => b.fechaLimpia.localeCompare(a.fechaLimpia))
            .slice(0, 6);

        return { montoHoy, entregadosHoy, hoyLocal, ultimas6 };
    }, [reparaciones]);

    const montoDisplay = stats?.montoHoy ?? 0;
    const historial = stats?.ultimas6 ?? [];

    return (
        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-[8px_8px_0px_0px_rgba(30,41,59,0.2)] border-2 border-slate-900">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Balance de Hoy</h3>
                <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded italic">
                    {stats?.hoyLocal}
                </span>
            </div>
            
            <div className="mb-6">
                <p className="text-4xl font-black text-blue-400 leading-none">
                    ${montoDisplay.toLocaleString('es-CO')}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Recaudación Real</p>
            </div>

            <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                    Últimas Entregas
                </h4>
                {historial.length > 0 ? (
                    historial.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between items-center text-[11px]">
                            <span className="font-mono text-slate-500">{item.fechaLimpia}</span>
                            <span className="font-black text-green-400">
                                +${item.montoNum.toLocaleString('es-CO')}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-[10px] text-slate-600 italic py-2 text-center">No hay registros recientes</p>
                )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-end">
                <div>
                    <p className="text-2xl font-black text-white leading-none">{stats?.entregadosHoy ?? 0}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Hoy</p>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-green-500 uppercase">Live</span>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE SECCIÓN FINANZAS (CON SALVAVIDAS) ---
// 
function SeccionFinanzas({ reparaciones }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [modoHistorico, setModoHistorico] = useState(true);

    const { reporteDiario, totalFiltrado } = useMemo(() => {
        const datosAgrupados = {}; // Aquí guardaremos { monto: X, cantidad: Y }
        let acumulado = 0;
        const hoy = new Date().toISOString().split('T')[0];

        (reparaciones || []).forEach(r => {
            const estadoActual = String(r.estado || "").trim().toLowerCase();
            
            if (estadoActual === 'entregado') {
                const rawDate = r.fecha_fin || r.fecha_inicio || r.created_at || hoy;
                const fechaISO = String(rawDate).substring(0, 10).replace(/\//g, '-');

                const cumpleInicio = modoHistorico || !fechaInicio || (fechaISO >= fechaInicio);
                const cumpleFin = modoHistorico || !fechaFin || (fechaISO <= fechaFin);

                if (cumpleInicio && cumpleFin) {
                    const monto = parseFloat(r.costo_estimado) || 0;
                    const [y, m, d] = fechaISO.split('-');
                    const fLabel = `${d}/${m}/${y}`;
                    
                    if (!datosAgrupados[fLabel]) {
                        datosAgrupados[fLabel] = { monto: 0, cantidad: 0 };
                    }
                    
                    datosAgrupados[fLabel].monto += monto;
                    datosAgrupados[fLabel].cantidad += 1; // Sumamos una entrega
                    acumulado += monto;
                }
            }
        });

        // Convertimos a array y ordenamos por fecha (más reciente primero)
        const lista = Object.entries(datosAgrupados).sort((a, b) => {
            const valA = a[0].split('/').reverse().join('');
            const valB = b[0].split('/').reverse().join('');
            return valB.localeCompare(valA);
        });

        return { reporteDiario: lista, totalFiltrado: acumulado };
    }, [reparaciones, fechaInicio, fechaFin, modoHistorico]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* SELECTORES DE MODO Y RANGO (Igual que antes) */}
            <div className="bg-white p-6 rounded-[32px] border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900">
                        <button onClick={() => setModoHistorico(true)} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${modoHistorico ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Historial Total</button>
                        <button onClick={() => setModoHistorico(false)} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${!modoHistorico ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Filtrar por Rango</button>
                    </div>
                    {!modoHistorico && (
                        <div className="flex items-center gap-2">
                            <input type="date" className="border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                            <span className="font-black text-slate-400">/</span>
                            <input type="date" className="border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* MONITOR DE INGRESOS */}
            <div className="bg-blue-600 p-10 rounded-[40px] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-black italic select-none">$$</div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80">
                    {modoHistorico ? "Total General en Caja" : "Total Filtrado en Rango"}
                 </p>
                 <h2 className="text-7xl font-black italic tracking-tighter">
                    ${totalFiltrado.toLocaleString('es-CO')}
                 </h2>
            </div>

            {/* TABLA DE REPORTES ACTUALIZADA */}
            <div className="bg-white rounded-[32px] border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <table className="w-full">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                        <tr>
                            <th className="p-6 text-left tracking-widest">Fecha de Cierre</th>
                            <th className="p-6 text-center tracking-widest">Cant. Entregas</th>
                            <th className="p-6 text-right tracking-widest">Total Recaudado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                        {reporteDiario.length > 0 ? (
                            reporteDiario.map(([fecha, info]) => (
                                <tr key={fecha} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="font-bold text-slate-700">{fecha}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full font-black text-xs border border-slate-200">
                                            {info.cantidad} {info.cantidad === 1 ? 'equipo' : 'equipos'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right font-black text-slate-900 text-xl">
                                        ${info.monto.toLocaleString('es-CO')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-20 text-center text-slate-400 font-black uppercase text-xs">
                                    No hay registros de "Entregados"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTES DE EDICIÓN ---
function EditableDiagnostico({ id, valorInicial, onSave }) {
    const [editando, setEditando] = useState(false);
    const [texto, setTexto] = useState(valorInicial || '');
    const [cargando, setCargando] = useState(false);

    const guardar = async () => {
        if (texto.trim() === (valorInicial || '').trim()) { setEditando(false); return; }
        try {
            setCargando(true);
            await tallerService.actualizarReparacion(id, { diagnostico_tecnico: texto });
            setEditando(false);
            onSave(); 
        } catch (err) { alert("Error al guardar."); } finally { setCargando(false); }
    };

    if (editando) return (
        <div className="relative">
            <textarea autoFocus disabled={cargando} className="text-xs p-2 border-2 border-blue-400 rounded w-full h-20 outline-none" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button onMouseDown={guardar} className="mt-1 bg-blue-600 text-white text-[10px] px-2 py-1 rounded">✓ GUARDAR</button>
        </div>
    );
    return (
        <div onClick={() => setEditando(true)} className="cursor-pointer p-2 rounded hover:bg-blue-50 transition-all min-h-[40px]">
            {valorInicial ? <p className="text-xs font-semibold text-blue-700 leading-tight">🛠️ {valorInicial}</p> : <span className="text-[10px] text-slate-400 italic">+ Diagnosticar</span>}
        </div>
    );
}

function EditableCosto({ id, valorInicial, onSave }) {
    const [editando, setEditando] = useState(false);
    const [monto, setMonto] = useState(valorInicial || 0);

    const guardar = async () => {
        try {
            await tallerService.actualizarReparacion(id, { costo_estimado: parseFloat(monto) });
            setEditando(false);
            onSave();
        } catch (err) { alert("Error al guardar costo."); }
    };

    if (editando) return (
        <input autoFocus type="number" className="w-24 text-xs p-1 border-2 border-green-500 rounded font-bold outline-none" value={monto} onChange={(e) => setMonto(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === 'Enter' && guardar()} />
    );
    return <div onClick={() => setEditando(true)} className="cursor-pointer p-2 rounded hover:bg-green-50 font-black text-green-600 text-sm text-center">${Number(valorInicial || 0).toLocaleString()}</div>;
}

// --- COMPONENTE PRINCIPAL ---
export default function Admin() {
    const [reps, setReps] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    // 1. CARGA Y NORMALIZACIÓN (Aquí se arregla el error de nombres repetidos)
    const load = async () => {
        try {
            const data = await tallerService.getDashboard();
            console.log("Datos brutos del servidor:", data);

            if (Array.isArray(data)) {
                const datosNormalizados = data.map(r => {
                    // Acceso dinámico según la estructura de tu console.log
                    const eq = r.equipos || {};
                    const cli = eq.cliente || {}; // 'cliente' es el alias que pusiste en tu backend

                    return {
                        ...r,
                        // Creamos propiedades planas para que React no se confunda
                        nombre_render: cli.nombre || 'Sin nombre',
                        cedula_render: cli.cedula || 'S/N',
                        marca_render: eq.marca || '---',
                        modelo_render: eq.modelo || '---'
                    };
                });
                setReps(datosNormalizados);
            }
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        }
    };

    useEffect(() => { load(); }, []);

    // 2. FILTRADO
    const reparacionesFiltradas = reps.filter(r => 
        r.nombre_render.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.cedula_render.includes(busqueda) ||
        r.id.includes(busqueda)
    );

    const handleEstado = async (id, nuevoEstado) => {
        try {
            await tallerService.actualizarReparacion(id, { estado: nuevoEstado });
            load();
        } catch (error) {
            console.error("Error al cambiar estado:", error);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* BUSCADOR */}
                <div className="p-4 border-b border-slate-100 bg-white">
                    <input 
                        type="text"
                        placeholder="Buscar por cliente, cédula o ID..."
                        className="w-full max-w-md border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase text-slate-500">Cliente</th>
                                <th className="p-4 text-xs font-bold uppercase text-slate-500">Equipo</th>
                                <th className="p-4 text-xs font-bold uppercase text-slate-500">Falla / Diagnóstico</th>
                                <th className="p-4 text-xs font-bold uppercase text-slate-500 text-center">Costo</th>
                                <th className="p-4 text-xs font-bold uppercase text-slate-500 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reparacionesFiltradas.map(r => (
                                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{r.nombre_render}</span>
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1 w-fit">
                                                CC: {r.cedula_render}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-700">
                                        {r.marca_render} <span className="text-slate-400 font-normal">{r.modelo_render}</span>
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
                                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-2 transition-all ${
                                                r.estado === 'Entregado' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                r.estado === 'En Reparación' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="En Reparación">En Reparación</option>
                                            <option value="Listo">Listo</option>
                                            <option value="Entregado">Entregado</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};