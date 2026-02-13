import { useState, useMemo } from 'react';

export default function AdminFinanzas({ reparaciones = [] }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const { finanzas, totalFiltrado } = useMemo(() => {
        const porDia = {};
        let acumulado = 0;

        reparaciones.forEach(r => {
            // 1. Validación de fecha para evitar "Invalid Date"
            const rawDate = r.created_at;
            if (!rawDate) return;

            const fechaObjeto = new Date(rawDate);
            if (isNaN(fechaObjeto.getTime())) return; // Salta si la fecha es inválida

            // Formato para comparar (YYYY-MM-DD)
            const fechaISO = fechaObjeto.toISOString().split('T')[0];

            // 2. Lógica de filtrado
            const cumpleInicio = !fechaInicio || fechaISO >= fechaInicio;
            const cumpleFin = !fechaFin || fechaISO <= fechaFin;

            if (cumpleInicio && cumpleFin) {
                const monto = Number(r.costo_estimado) || 0;
                // Formato para mostrar en tabla (DD/MM/YYYY)
                const fechaLabel = fechaObjeto.toLocaleDateString('es-ES');
                
                porDia[fechaLabel] = (porDia[fechaLabel] || 0) + monto;
                acumulado += monto;
            }
        });

        // 3. Ordenar: de más reciente a más antiguo
        const listaOrdenada = Object.entries(porDia).sort((a, b) => {
            const [dA, mA, yA] = a[0].split('/');
            const [dB, mB, yB] = b[0].split('/');
            return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, yA);
        });

        return { finanzas: listaOrdenada, totalFiltrado: acumulado };
    }, [reparaciones, fechaInicio, fechaFin]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* SECCIÓN DE FILTROS (NUEVA) */}
            <div className="bg-white p-4 rounded-3xl border shadow-sm flex flex-wrap items-center gap-4 justify-center">
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Desde:</label>
                    <input 
                        type="date" 
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="text-xs border rounded-lg p-1 px-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta:</label>
                    <input 
                        type="date" 
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="text-xs border rounded-lg p-1 px-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold"
                    />
                </div>
                {(fechaInicio || fechaFin) && (
                    <button 
                        onClick={() => { setFechaInicio(''); setFechaFin(''); }}
                        className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                    >
                        Limpiar Filtros
                    </button>
                )}
            </div>

            {/* HEADER (Igual a tu imagen) */}
            <div className="bg-white p-8 rounded-3xl border-2 border-slate-900 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Libro de Ingresos</h2>
                    <p className="text-slate-400 text-sm italic">Desglose de ganancias diarias</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Acumulado</p>
                    <p className="text-5xl font-black text-green-500">
                        ${totalFiltrado.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* TABLA (Igual a tu imagen) */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b-2 border-slate-900">
                        <tr>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                            <th className="p-5 text-right text-[10px] font-bold text-slate-400 uppercase">Ganancia Bruta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-900">
                        {finanzas.length > 0 ? (
                            finanzas.map(([fecha, monto]) => (
                                <tr key={fecha} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-5 font-black text-slate-700">{fecha}</td>
                                    <td className="p-5 text-right font-black text-blue-600 text-2xl">
                                        ${monto.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="p-10 text-center text-slate-400 italic">
                                    No se encontraron registros en este rango.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}