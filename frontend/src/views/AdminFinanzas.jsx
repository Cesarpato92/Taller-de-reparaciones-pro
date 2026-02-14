import { useState, useMemo } from 'react';

export default function AdminFinanzas({ reparaciones = [] }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const { finanzas, totalFiltrado, maxMonto } = useMemo(() => {
        const porDia = {};
        let acumulado = 0;
        let max = 0;

        // Solo procesamos reparaciones "Entregado"
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
            }
        });

        // Calculamos el máximo después de agrupar para la escala del gráfico
        Object.values(porDia).forEach(m => { if (m > max) max = m; });

        // Orden cronológico (importante para el gráfico)
        const listaOrdenada = Object.entries(porDia).sort((a, b) => {
            const [dA, mA, yA] = a[0].split('/');
            const [dB, mB, yB] = b[0].split('/');
            return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
        });

        return { 
            finanzas: listaOrdenada, 
            totalFiltrado: acumulado, 
            maxMonto: max || 1 // Evitar división por cero
        };
    }, [reparaciones, fechaInicio, fechaFin]);

    return (
        <div className="space-y-6 pb-10">
            {/* ... Aquí van tus Filtros y el Header del Total ... */}

            {/* SECCIÓN DEL GRÁFICO CORREGIDA */}
            {finanzas.length > 0 ? (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-10 tracking-widest">
                        Tendencia de Ingresos
                    </h3>
                    
                    {/* Contenedor con altura fija obligatoria */}
                    <div className="relative h-[250px] w-full flex items-end gap-2 px-2 border-b-2 border-slate-100">
                        {finanzas.map(([fecha, monto]) => {
                            // Cálculo del porcentaje de altura
                            const alturaPorcentaje = (monto / maxMonto) * 100;
                            
                            return (
                                <div key={fecha} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Etiqueta flotante al hacer hover */}
                                    <div className="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded z-20 whitespace-nowrap">
                                        ${monto.toLocaleString()}
                                    </div>
                                    
                                    {/* La Barra */}
                                    <div 
                                        className="w-full min-w-[15px] bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600 cursor-help"
                                        style={{ height: `${alturaPorcentaje}%` }}
                                    ></div>
                                    
                                    {/* Fecha debajo de la barra */}
                                    <span className="absolute -bottom-7 text-[9px] font-black text-slate-400 whitespace-nowrap rotate-45 sm:rotate-0">
                                        {fecha.split('/')[0]}/{fecha.split('/')[1]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Espaciador inferior para las fechas rotadas */}
                    <div className="h-8"></div>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 italic">
                    No hay suficientes datos para generar el gráfico
                </div>
            )}

            

            {/* TABLA DE RESULTADOS (Mostrando lo más reciente primero) */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b-2 border-slate-900">
                        <tr>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                            <th className="p-5 text-right text-[10px] font-bold text-slate-400 uppercase">Ganancia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-900">
                        {[...finanzas].reverse().map(([fecha, monto]) => (
                            <tr key={fecha} className="hover:bg-slate-50 transition-colors">
                                <td className="p-5 font-black text-slate-700">{fecha}</td>
                                <td className="p-5 text-right font-black text-blue-600 text-xl">
                                    ${monto.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}