import React, { useState, useMemo } from 'react';
import { tallerService } from '../api/tallerService';

/** 
 * MÓDULO DE FINANZAS
 * Proporciona análisis detallado de ingresos, gráficos de rendimiento y reportes diarios.
 * Permite filtrar por rangos de fecha y visualizar ganancias netas.
 */
export default function SeccionFinanzas({ reparaciones, load }) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [modoHistorico, setModoHistorico] = useState(true);
    const [tooltipData, setTooltipData] = useState(null);
    const [diaExpandido, setDiaExpandido] = useState(null); // Nuevo estado para expansión

    const { reporteDiario, totalFiltrado } = useMemo(() => {
        const datosAgrupados = {};
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
                    const precioRepuesto = parseFloat(r.precio_repuesto) || 0;
                    const [y, m, d] = fechaISO.split('-');
                    const fLabel = `${d}/${m}/${y}`;

                    if (!datosAgrupados[fLabel]) {
                        datosAgrupados[fLabel] = { monto: 0, cantidad: 0, repuestos: 0, reparaciones: [] };
                    }

                    datosAgrupados[fLabel].monto += monto;
                    datosAgrupados[fLabel].repuestos += precioRepuesto;
                    datosAgrupados[fLabel].cantidad += 1;
                    datosAgrupados[fLabel].reparaciones.push({
                        id: r.id,
                        cliente: r.nombre_render || 'Sin nombre',
                        equipo: `${r.marca_render} ${r.modelo_render}`,
                        costo: monto,
                        ganancia: monto - precioRepuesto
                    });
                    acumulado += (monto - precioRepuesto);
                }
            }
        });

        const lista = Object.entries(datosAgrupados).sort((a, b) => {
            const valA = a[0].split('/').reverse().join('');
            const valB = b[0].split('/').reverse().join('');
            return valB.localeCompare(valA);
        });

        return { reporteDiario: lista, totalFiltrado: acumulado };
    }, [reparaciones, fechaInicio, fechaFin, modoHistorico]);

    const ultimos7Dias = useMemo(() => {
        const hoy = new Date();
        const datos7Dias = [];

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

        const entregadas = reparaciones.filter(r => r.estado?.toLowerCase() === 'entregado');

        entregadas.forEach(r => {
            const rawDate = r.fecha_fin || r.fecha_inicio || r.created_at;
            if (!rawDate) return;

            const fechaISO = String(rawDate).substring(0, 10).replace(/\//g, '-');
            const diaEncontrado = datos7Dias.find(d => d.fecha === fechaISO);

            if (diaEncontrado) {
                const monto = parseFloat(r.costo_estimado) || 0;
                const repuesto = parseFloat(r.precio_repuesto) || 0;

                diaEncontrado.cantidad += 1;
                diaEncontrado.monto += monto;
                diaEncontrado.repuestos += repuesto;
                diaEncontrado.ganancia += (monto - repuesto);
            }
        });

        return datos7Dias;
    }, [reparaciones]);

    return (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* SELECTORES DE MODO Y RANGO */}
            <div className="bg-white p-3 rounded-[24px] border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900 w-full sm:w-auto">
                        <button onClick={() => setModoHistorico(true)} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${modoHistorico ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Historial Total</button>
                        <button onClick={() => setModoHistorico(false)} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${!modoHistorico ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Filtrar por Rango</button>
                    </div>
                    {!modoHistorico && (
                        <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto">
                            <input type="date" className="w-full sm:w-auto border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                            <span className="font-black text-slate-400 hidden xs:inline">/</span>
                            <input type="date" className="w-full sm:w-auto border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* MONITOR DE INGRESOS */}
            <div className="bg-blue-600 p-6 rounded-[32px] border border-blue-500 shadow-sm text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-black italic select-none">$$</div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80">
                    {modoHistorico ? "Ganancia Total en Caja" : "Ganancia Total en Rango"}
                </p>
                <h2 className="text-7xl font-black italic tracking-tighter">
                    ${totalFiltrado.toLocaleString('es-CO')}
                </h2>
            </div>

            {/* GRÁFICO DE LÍNEAS - ÚLTIMOS 7 DÍAS */}
            <div className="bg-white p-3 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-center font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">
                    📈 Últimos 7 Días
                </h3>

                <div className="relative h-64">
                    {tooltipData && (
                        <div
                            className="absolute bg-slate-900 text-white p-3 rounded-xl shadow-lg border-2 border-white z-20 pointer-events-none"
                            style={{
                                left: `${tooltipData.x}px`,
                                top: `${tooltipData.y}px`,
                                transform: 'translate(-50%, -120%)'
                            }}
                        >
                            <div className="text-xs font-black mb-2 text-center border-b border-white/20 pb-1">
                                {tooltipData.fecha}
                            </div>
                            <div className="space-y-1 text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span>Recaudado: <strong>${tooltipData.monto.toLocaleString()}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span>Repuestos: <strong>${tooltipData.repuestos.toLocaleString()}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span>Ganancia: <strong>${tooltipData.ganancia.toLocaleString()}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <span>Equipos: <strong>{tooltipData.cantidad}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <svg viewBox="0 0 700 250" className="w-full h-full overflow-visible">
                        <line x1="50" y1="200" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="50" y1="20" x2="50" y2="200" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="650" y1="20" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="2" />

                        {ultimos7Dias.map((dia, idx) => {
                            const x = 50 + (idx * 100);
                            return (
                                <text key={idx} x={x} y="220" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">
                                    {dia.fechaCorta}
                                </text>
                            );
                        })}

                        {(() => {
                            const maxMonto = Math.max(...ultimos7Dias.map(d => Math.max(d.monto, d.repuestos, d.ganancia)), 1);
                            const maxCantidad = Math.max(...ultimos7Dias.map(d => d.cantidad), 1);

                            const escalarMonto = (valor) => 200 - ((valor / maxMonto) * 160);
                            const escalarCantidad = (valor) => 200 - ((valor / maxCantidad) * 160);

                            const puntosMonto = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.monto)}`).join(' ');
                            const puntosRepuestos = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.repuestos)}`).join(' ');
                            const puntosGanancia = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarMonto(d.ganancia)}`).join(' ');
                            const puntosCantidad = ultimos7Dias.map((d, i) => `${50 + i * 100},${escalarCantidad(d.cantidad)}`).join(' ');

                            return (
                                <>
                                    <polyline points={puntosMonto} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points={puntosRepuestos} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points={puntosGanancia} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points={puntosCantidad} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,5" />

                                    {ultimos7Dias.map((d, i) => {
                                        const cx = 50 + i * 100;
                                        return (
                                            <g key={`punto-${i}`}>
                                                <circle
                                                    cx={cx}
                                                    cy={110}
                                                    r="40"
                                                    fill="transparent"
                                                    style={{ cursor: 'pointer' }}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                                                        const svgX = cx / 700 * rect.width;
                                                        setTooltipData({
                                                            x: svgX,
                                                            y: 20,
                                                            fecha: d.fechaCorta,
                                                            monto: d.monto,
                                                            repuestos: d.repuestos,
                                                            ganancia: d.ganancia,
                                                            cantidad: d.cantidad
                                                        });
                                                    }}
                                                    onMouseLeave={() => setTooltipData(null)}
                                                />
                                                <circle cx={cx} cy={escalarMonto(d.monto)} r="4" fill="#3b82f6" style={{ pointerEvents: 'none' }} />
                                                <circle cx={cx} cy={escalarMonto(d.repuestos)} r="4" fill="#f59e0b" style={{ pointerEvents: 'none' }} />
                                                <circle cx={cx} cy={escalarMonto(d.ganancia)} r="4" fill="#10b981" style={{ pointerEvents: 'none' }} />
                                                <circle cx={cx} cy={escalarCantidad(d.cantidad)} r="4" fill="#8b5cf6" style={{ pointerEvents: 'none' }} />
                                            </g>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </svg>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-blue-500 rounded"></div>
                        <span>Recaudado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-amber-500 rounded"></div>
                        <span>Repuestos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-green-500 rounded"></div>
                        <span>Ganancia</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                            <tr>
                                <th className="p-6 text-left tracking-widest">Fecha de Cierre</th>
                                <th className="p-6 text-center tracking-widest">Cant. Entregas</th>
                                <th className="p-6 text-right tracking-widest">Precio Repuestos</th>
                                <th className="p-6 text-right tracking-widest">Total Recaudado</th>
                                <th className="p-6 text-center tracking-widest">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {reporteDiario.length > 0 ? (
                                reporteDiario.map(([fecha, info]) => (
                                    <React.Fragment key={fecha}>
                                        <tr className={`hover:bg-blue-50/50 transition-colors ${diaExpandido === fecha ? 'bg-blue-50' : ''}`}>
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
                                            <td className="p-6 text-right font-black text-amber-600 text-lg">
                                                ${info.repuestos.toLocaleString('es-CO')}
                                            </td>
                                            <td className="p-6 text-right font-black text-slate-900 text-xl">
                                                ${info.monto.toLocaleString('es-CO')}
                                            </td>
                                            <td className="p-6 text-center">
                                                <button
                                                    onClick={() => setDiaExpandido(diaExpandido === fecha ? null : fecha)}
                                                    className={`p-2 rounded-lg transition-all ${diaExpandido === fecha ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    {diaExpandido === fecha ? '▲' : '▼'}
                                                </button>
                                            </td>
                                        </tr>
                                        {diaExpandido === fecha && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="5" className="p-0 border-b-2 border-slate-200">
                                                    <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                                                        <table className="w-full text-left text-[11px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner">
                                                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[9px]">
                                                                <tr>
                                                                    <th className="p-3">Cliente</th>
                                                                    <th className="p-3">Equipo</th>
                                                                    <th className="p-3 text-right">Costo Total</th>
                                                                    <th className="p-3 text-right">Ganancia Neta</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {info.reparaciones.map((rep, rid) => (
                                                                    <tr key={rid} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="p-3 font-bold text-slate-800">{rep.cliente}</td>
                                                                        <td className="p-3 text-slate-600">{rep.equipo}</td>
                                                                        <td className="p-3 text-right font-black text-slate-400">${rep.costo.toLocaleString('es-CO')}</td>
                                                                        <td className="p-3 text-right font-black text-green-600">${rep.ganancia.toLocaleString('es-CO')}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 font-black uppercase text-xs">
                                        No hay registros de "Entregados"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
