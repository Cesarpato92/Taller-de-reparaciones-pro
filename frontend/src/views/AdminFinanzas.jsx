import { useState, useMemo } from 'react';

export default function AdminFinanzas({ reparaciones = [] }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const { finanzas, totalGeneral, maxMonto } = useMemo(() => {
        const porDia = {};
        let acumulado = 0;
        let max = 0;

        // Filtramos solo los ENTREGADOS para las finanzas
        const entregadas = reparaciones.filter(r => r.estado?.toUpperCase() === 'ENTREGADO');

        entregadas.forEach(r => {
            const rawDate = r.fecha_inicio || r.created_at; 
            if (!rawDate) return;

            const fechaISO = rawDate.split('T')[0];
            const cumpleInicio = !fechaInicio || fechaISO >= fechaInicio;
            const cumpleFin = !fechaFin || fechaISO <= fechaFin;

            if (cumpleInicio && cumpleFin) {
                const monto = Number(r.costo_estimado) || 0;
                porDia[fechaISO] = (porDia[fechaISO] || 0) + monto;
                acumulado += monto;
            }
        });

        Object.values(porDia).forEach(m => { if (m > max) max = m; });

        const listaOrdenada = Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]));

        return { 
            finanzas: listaOrdenada, 
            totalGeneral: acumulado, 
            maxMonto: max || 1 
        };
    }, [reparaciones, fechaInicio, fechaFin]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-4 p-4">
            
            {/* 1. BANNER AZUL (El que ya tienes en la foto) */}
            <div className="bg-blue-600 p-10 rounded-[40px] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2 opacity-80">Total General en Caja</span>
                <h2 className="text-white text-7xl font-black tracking-tighter">${totalGeneral.toLocaleString()}</h2>
                <div className="absolute right-8 bottom-0 text-white/20 text-9xl font-black select-none">$$</div>
            </div>

            {/* 2. EL GRÁFICO (Nuevo: Insertado entre el banner y la tabla) */}
            {finanzas.length > 0 && (
                <div className="bg-white p-6 rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-end justify-around h-40 gap-2 px-4">
                        {finanzas.map(([fecha, monto]) => {
                            const porcentaje = (monto / maxMonto) * 100;
                            const [y, m, d] = fecha.split('-');
                            return (
                                <div key={fecha} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Etiqueta flotante */}
                                    <div className="absolute -top-8 hidden group-hover:block bg-black text-white text-[10px] font-bold px-2 py-1 rounded">
                                        ${monto.toLocaleString()}
                                    </div>
                                    {/* Barra */}
                                    <div 
                                        className="w-full max-w-[40px] bg-blue-500 border-2 border-black rounded-t-lg transition-all hover:bg-blue-400"
                                        style={{ height: `${porcentaje}%` }}
                                    ></div>
                                    {/* Fecha corta */}
                                    <span className="text-[10px] font-bold text-slate-500 mt-2">{d}/{m}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. TABLA DE CIERRES (La que aparece en tu imagen 11c8c7.png) */}
            <div className="bg-[#0f172a] rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="grid grid-cols-3 p-4 border-b border-white/10 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">
                    <div>Fecha de Cierre</div>
                    <div>Cant. Entregas</div>
                    <div>Total Recaudado</div>
                </div>
                <div className="divide-y divide-white/5">
                    {[...finanzas].reverse().map(([fecha, monto]) => {
                        const [y, m, d] = fecha.split('-');
                        return (
                            <div key={fecha} className="grid grid-cols-3 p-6 items-center text-center group hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <span className="text-white font-bold">{d}/{m}/{y}</span>
                                </div>
                                <div>
                                    <span className="bg-white/10 text-white text-[10px] px-3 py-1 rounded-full border border-white/20">
                                        Check
                                    </span>
                                </div>
                                <div className="text-white text-xl font-black">
                                    ${monto.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}