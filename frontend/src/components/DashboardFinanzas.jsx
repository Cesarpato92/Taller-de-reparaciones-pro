import { useMemo } from 'react';

export default function DashboardFinanzas({ reparaciones }) {
    const stats = useMemo(() => {
        // 1. Obtener la fecha de hoy en formato local YYYY-MM-DD
        const hoy = new Date();
        const offset = hoy.getTimezoneOffset();
        const hoyLocal = new Date(hoy.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

        let montoHoy = 0;
        let entregadosHoy = 0;
        let totalCajaHistorico = 0;

        reparaciones.forEach(r => {
            const esEntregado = String(r.estado).toLowerCase() === 'entregado';
            const monto = parseFloat(r.costo_estimado) || 0;

            if (esEntregado) {
                totalCajaHistorico += monto;

                // 2. Extraer solo la fecha del registro (YYYY-MM-DD)
                const fechaRegistro = (r.fecha_fin || r.created_at || '').substring(0, 10);

                // 3. Comparar con hoy
                if (fechaRegistro === hoyLocal) {
                    montoHoy += monto;
                    entregadosHoy += 1;
                }
            }
        });

        return { montoHoy, entregadosHoy, totalCajaHistorico };
    }, [reparaciones]);

    return (
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Resumen de Hoy</h3>
                <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {entregadosHoy} REPARACIONES
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* CAJA DE HOY */}
                <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[9px] font-black uppercase opacity-80">Ingresos Hoy</p>
                    <p className="text-2xl font-black">${stats.montoHoy.toLocaleString()}</p>
                </div>

                {/* CAJA TOTAL HISTÓRICA */}
                <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[9px] font-black uppercase opacity-80">Total Caja</p>
                    <p className="text-2xl font-black">${stats.totalCajaHistorico.toLocaleString()}</p>
                </div>
            </div>

            {/* INDICADOR VISUAL */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Estado del Sistema</p>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-700">ACTIVO</span>
                    </div>
                </div>
            </div>
        </div>
    );
}