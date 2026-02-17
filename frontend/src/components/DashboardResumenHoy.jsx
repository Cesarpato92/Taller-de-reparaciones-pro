import { useMemo } from 'react';

// --- SUB-COMPONENTE DASHBOARD LATERAL CON LOGS ---
export default function DashboardResumenHoy({ reparaciones }) {
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
        <div className="bg-slate-900 p-4 rounded-[24px] text-white shadow-sm border border-slate-800">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Balance de Hoy</h3>
                <span className="text-xl">📊</span>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-black">${montoDisplay.toLocaleString('es-CO')}</span>
                </div>
                <p className="text-[10px] text-green-400 font-bold mt-1 uppercase tracking-widest">
                    {stats?.entregadosHoy} Equipos entregados hoy
                </p>
            </div>

            <div className="border-t border-slate-800 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Últimos cobros</h4>
                <div className="space-y-4">
                    {historial.map((r, i) => (
                        <div key={`hist-${r.id}-${i}`} className="flex justify-between items-center group">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                                    {r.equipos?.marca || 'Equipo'} {r.equipos?.modelo || ''}
                                </span>
                                <span className="text-[9px] text-slate-500">{r.fechaLimpia}</span>
                            </div>
                            <span className="text-xs font-black text-green-500">+${r.montoNum.toLocaleString('es-CO')}</span>
                        </div>
                    ))}
                    {historial.length === 0 && (
                        <p className="text-[10px] italic text-slate-600">No hay cobros registrados recientemente</p>
                    )}
                </div>
            </div>
        </div>
    );
}
