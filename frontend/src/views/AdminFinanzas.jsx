import { useState, useMemo } from 'react';

export default function AdminFinanzas({ reparaciones = [] }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const { finanzas, totalFiltrado, maxMonto } = useMemo(() => {
        const porDia = {};
        let acumulado = 0;
        let max = 0;

        const entregadas = reparaciones.filter(r => r.estado === 'Entregado');

        entregadas.forEach(r => {
            const rawDate = r.fecha_inicio || r.created_at; 
            if (!rawDate) return;

            const fechaISO = rawDate.split('T')[0];
            const cumpleInicio = !fechaInicio || fechaISO >= fechaInicio;
            const cumpleFin = !fechaFin || fechaISO <= fechaFin;

            if (cumpleInicio && cumpleFin) {
                const monto = Number(r.costo_estimado) || 0;
                const [y, m, d] = fechaISO.split('-');
                const fechaLabel = `${d}/${m}/${y}`;
                
                porDia[fechaLabel] = (porDia[fechaLabel] || 0) + monto;
                acumulado += monto;
                if (porDia[fechaLabel] > max) max = porDia[fechaLabel];
            }
        });

        const listaOrdenada = Object.entries(porDia).sort((a, b) => {
            const [dA, mA, yA] = a[0].split('/');
            const [dB, mB, yB] = b[0].split('/');
            return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB); // Orden cronológico para el gráfico
        });

        return { 
            finanzas: listaOrdenada, 
            totalFiltrado: acumulado, 
            maxMonto: max 
        };
    }, [reparaciones, fechaInicio, fechaFin]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            
            {/* ... (SECCIÓN DE FILTROS Y HEADER IGUAL AL ANTERIOR) ... */}

            {/* GRÁFICO DE BARRAS DINÁMICO */}
            {finanzas.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase mb-8 tracking-widest">Tendencia de Ingresos</h3>
                    <div className="flex items-end gap-2 h-48 px-2">
                        {finanzas.map(([fecha, monto]) => {
                            const porcentaje = (monto / maxMonto) * 100;
                            return (
                                <div key={fecha} className="flex-1 flex flex-col items-center group relative">
                                    {/* Tooltip al pasar el mouse */}
                                    <div className="absolute -top-10 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl z-10 whitespace-nowrap">
                                        ${monto.toLocaleString()}
                                    </div>
                                    
                                    {/* Barra */}
                                    <div 
                                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 cursor-pointer"
                                        style={{ height: `${porcentaje}%` }}
                                    ></div>
                                    
                                    {/* Etiqueta de fecha (solo día/mes) */}
                                    <span className="text-[8px] font-bold text-slate-400 mt-2 rotate-45 sm:rotate-0">
                                        {fecha.split('/')[0]}/{fecha.split('/')[1]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            

            {/* TABLA DE RESULTADOS (Invertimos la lista para mostrar lo más reciente arriba en la tabla) */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b-2 border-slate-900">
                        <tr>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                            <th className="p-5 text-right text-[10px] font-bold text-slate-400 uppercase">Ingreso Bruto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-900">
                        {[...finanzas].reverse().map(([fecha, monto]) => (
                            <tr key={fecha} className="hover:bg-blue-50/50">
                                <td className="p-5 font-black text-slate-700">{fecha}</td>
                                <td className="p-5 text-right font-black text-blue-600 text-2xl">
                                    ${monto.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MINI ESTADÍSTICAS (IGUAL AL ANTERIOR) */}
        </div>
    );
}