import { useState, useMemo } from 'react';

export default function AdminFinanzas({ reparaciones = [] }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const { finanzas, totalGeneral, maxMonto, totalRepuestos } = useMemo(() => {
        const porDia = {};
        let acumulado = 0;
        let acumuladoRepuestos = 0;
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
                const precioRepuesto = Number(r.precio_repuesto) || 0;

                if (!porDia[fechaISO]) {
                    porDia[fechaISO] = { monto: 0, repuestos: 0, cantidad: 0 };
                }

                porDia[fechaISO].monto += monto;
                porDia[fechaISO].repuestos += precioRepuesto;
                porDia[fechaISO].cantidad += 1;

                acumulado += monto;
                acumuladoRepuestos += precioRepuesto;
            }
        });

        Object.values(porDia).forEach(d => { if (d.monto > max) max = d.monto; });

        const listaOrdenada = Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]));

        return {
            finanzas: listaOrdenada,
            totalGeneral: acumulado,
            totalRepuestos: acumuladoRepuestos,
            maxMonto: max || 1
        };
    }, [reparaciones, fechaInicio, fechaFin]);

    // Cálculo de datos de los últimos 7 días para el gráfico de líneas
    const ultimos7Dias = useMemo(() => {
        const hoy = new Date();
        const datos7Dias = [];

        // Generar últimos 7 días
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - i);
            const fechaISO = fecha.toISOString().split('T')[0];

            datos7Dias.push({
                fecha: fechaISO,
                fechaCorta: `${fecha.getDate()}/${fecha.getMonth() + 1}`,
                cantidad: 0,
                monto: 0,
                repuestos: 0,
                ganancia: 0
            });
        }

        // Filtrar reparaciones entregadas
        const entregadas = reparaciones.filter(r => r.estado?.toUpperCase() === 'ENTREGADO');

        // Agregar datos a cada día
        entregadas.forEach(r => {
            const rawDate = r.fecha_inicio || r.created_at;
            if (!rawDate) return;

            const fechaISO = rawDate.split('T')[0];
            const diaEncontrado = datos7Dias.find(d => d.fecha === fechaISO);

            if (diaEncontrado) {
                const monto = Number(r.costo_estimado) || 0;
                const repuesto = Number(r.precio_repuesto) || 0;

                diaEncontrado.cantidad += 1;
                diaEncontrado.monto += monto;
                diaEncontrado.repuestos += repuesto;
                diaEncontrado.ganancia += (monto - repuesto);
            }
        });

        return datos7Dias;
    }, [reparaciones]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-4 p-4">

            {/* 1. BANNER AZUL  */}
            <div className="bg-blue-600 p-10 rounded-[40px] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2 opacity-80">Total General en Caja</span>
                <h2 className="text-white text-7xl font-black tracking-tighter">${totalGeneral.toLocaleString()}</h2>
                <div className="absolute right-8 bottom-0 text-white/20 text-9xl font-black select-none">$$</div>
            </div>

            {/* 1.5 GRÁFICO DE LÍNEAS - ÚLTIMOS 7 DÍAS */}
            <div className="bg-white p-6 rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-center font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">
                    📈 Últimos 7 Días
                </h3>

                <div className="relative h-64">
                    <svg viewBox="0 0 700 250" className="w-full h-full">
                        {/* Ejes */}
                        <line x1="50" y1="200" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="50" y1="20" x2="50" y2="200" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="650" y1="20" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="2" />

                        {/* Etiquetas X (fechas) */}
                        {ultimos7Dias.map((dia, idx) => {
                            const x = 50 + (idx * 100);
                            return (
                                <text key={idx} x={x} y="220" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">
                                    {dia.fechaCorta}
                                </text>
                            );
                        })}

                        {/* Calcular escalas */}
                        {(() => {
                            const maxMonto = Math.max(...ultimos7Dias.map(d => Math.max(d.monto, d.repuestos, d.ganancia)), 1);
                            const maxCantidad = Math.max(...ultimos7Dias.map(d => d.cantidad), 1);

                            // Función para escalar valores monetarios (eje izquierdo)
                            const escalarMonto = (valor) => 200 - ((valor / maxMonto) * 160);

                            // Función para escalar cantidad (eje derecho)
                            const escalarCantidad = (valor) => 200 - ((valor / maxCantidad) * 160);

                            // Generar puntos para cada línea
                            const puntosMonto = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.monto)}`).join(' ');
                            const puntosRepuestos = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.repuestos)}`).join(' ');
                            const puntosGanancia = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.ganancia)}`).join(' ');
                            const puntosCantidad = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarCantidad(d.cantidad)}`).join(' ');

                            return (
                                <>
                                    {/* Línea de Total Recaudado (Azul) */}
                                    <polyline
                                        points={puntosMonto}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {ultimos7Dias.map((d, i) => (
                                        <circle key={`monto-${i}`} cx={50 + i * 100} cy={escalarMonto(d.monto)} r="4" fill="#3b82f6">
                                            <title>${d.monto.toLocaleString()} - Total Recaudado</title>
                                        </circle>
                                    ))}

                                    {/* Línea de Precio Repuestos (Ámbar) */}
                                    <polyline
                                        points={puntosRepuestos}
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {ultimos7Dias.map((d, i) => (
                                        <circle key={`rep-${i}`} cx={50 + i * 100} cy={escalarMonto(d.repuestos)} r="4" fill="#f59e0b">
                                            <title>${d.repuestos.toLocaleString()} - Precio Repuestos</title>
                                        </circle>
                                    ))}

                                    {/* Línea de Ganancia (Verde) */}
                                    <polyline
                                        points={puntosGanancia}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {ultimos7Dias.map((d, i) => (
                                        <circle key={`gan-${i}`} cx={50 + i * 100} cy={escalarMonto(d.ganancia)} r="4" fill="#10b981">
                                            <title>${d.ganancia.toLocaleString()} - Ganancia</title>
                                        </circle>
                                    ))}

                                    {/* Línea de Cantidad (Púrpura) */}
                                    <polyline
                                        points={puntosCantidad}
                                        fill="none"
                                        stroke="#8b5cf6"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray="5,5"
                                    />
                                    {ultimos7Dias.map((d, i) => (
                                        <circle key={`cant-${i}`} cx={50 + i * 100} cy={escalarCantidad(d.cantidad)} r="4" fill="#8b5cf6">
                                            <title>{d.cantidad} equipos</title>
                                        </circle>
                                    ))}

                                    {/* Etiquetas del eje Y izquierdo (dinero) */}
                                    <text x="10" y="25" fontSize="9" fill="#64748b" fontWeight="bold">$</text>
                                    <text x="5" y="200" fontSize="9" fill="#64748b" fontWeight="bold">$0</text>

                                    {/* Etiquetas del eje Y derecho (cantidad) */}
                                    <text x="660" y="25" fontSize="9" fill="#8b5cf6" fontWeight="bold">#</text>
                                    <text x="660" y="200" fontSize="9" fill="#8b5cf6" fontWeight="bold">0</text>
                                </>
                            );
                        })()}
                    </svg>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-blue-500 rounded"></div>
                        <span className="text-slate-700">Total Recaudado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-amber-500 rounded"></div>
                        <span className="text-slate-700">Precio Repuestos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-green-500 rounded"></div>
                        <span className="text-slate-700">Ganancia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-purple-500 rounded" style={{ borderTop: '2px dashed #8b5cf6', background: 'none' }}></div>
                        <span className="text-slate-700">Equipos Reparados</span>
                    </div>
                </div>
            </div>

            {/* 2. EL GRÁFICO (Insertado entre el banner y la tabla) */}
            {finanzas.length > 0 && (
                <div className="bg-white p-6 rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-end justify-around h-40 gap-2 px-4">
                        {finanzas.map(([fecha, datos]) => {
                            const porcentaje = (datos.monto / maxMonto) * 100;
                            const [y, m, d] = fecha.split('-');
                            return (
                                <div key={fecha} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Etiqueta flotante */}
                                    <div className="absolute -top-8 hidden group-hover:block bg-black text-white text-[10px] font-bold px-2 py-1 rounded">
                                        ${datos.monto.toLocaleString()}
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

            {/* 3. TABLA DE CIERRES */}
            <div className="bg-[#0f172a] rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="grid grid-cols-4 p-4 border-b border-white/10 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">
                    <div>Fecha de Cierre</div>
                    <div>Cant. Entregas</div>
                    <div>Precio Repuestos</div>
                    <div>Total Recaudado</div>
                </div>
                <div className="divide-y divide-white/5">
                    {[...finanzas].reverse().map(([fecha, datos]) => {
                        const [y, m, d] = fecha.split('-');
                        return (
                            <div key={fecha} className="grid grid-cols-4 p-6 items-center text-center group hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <span className="text-white font-bold">{d}/{m}/{y}</span>
                                </div>
                                <div>
                                    <span className="bg-white/10 text-white text-[10px] px-3 py-1 rounded-full border border-white/20 font-black">
                                        {datos.cantidad} {datos.cantidad === 1 ? 'equipo' : 'equipos'}
                                    </span>
                                </div>
                                <div className="text-amber-400 text-lg font-black">
                                    ${datos.repuestos.toLocaleString()}
                                </div>
                                <div className="text-white text-xl font-black">
                                    ${datos.monto.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}