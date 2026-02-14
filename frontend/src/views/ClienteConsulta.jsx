import { useState } from 'react';
import { tallerService } from '../api/tallerService';

export default function ClienteConsulta() {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);

    const buscar = async () => {
        if (!query.trim()) return;
        setBuscando(true);
        try {
            const data = await tallerService.getDashboard();
            
            // 1. Filtrar por cédula (estructura correcta según tu SQL)
            const filtrados = data.filter(r => {
                // Acceso correcto a la cédula a través de la relación
                const cedulaCliente = r.equipos?.clientes?.cedula;
                
                // Si no encuentra con la primera estructura, intenta con la alternativa
                // pero según tu SQL, debería ser r.equipos.clientes.cedula
                return cedulaCliente && cedulaCliente.toString().includes(query.trim());
            });

            // 2. Ordenar: Pendientes/En Proceso arriba, Entregados abajo
            const ordenados = filtrados.sort((a, b) => {
                const prioridad = { "Pendiente": 1, "En Proceso": 2, "Reparado": 3, "Entregado": 4 };
                return (prioridad[a.estado] || 99) - (prioridad[b.estado] || 99);
            });

            setResultados(ordenados);
        } catch (error) {
            console.error("Error al consultar:", error);
        } finally {
            setBuscando(false);
        }
    };

    // Función para obtener datos del equipo de manera segura
    const getEquipoData = (reparacion) => {
        return {
            marca: reparacion.equipos?.marca || 'Marca no disponible',
            modelo: reparacion.equipos?.modelo || 'Modelo no disponible',
            cliente: reparacion.equipos?.clientes || null
        };
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <h2 className="text-2xl font-black mb-6 text-center text-slate-800">Rastreo de Equipos</h2>
            
            <div className="flex gap-2 mb-8">
                <input 
                    className="flex-1 p-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Ingresa tu número de cédula..." 
                    value={query}
                    onChange={e => setQuery(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && buscar()}
                />
                <button 
                    onClick={buscar} 
                    disabled={buscando}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition-colors disabled:bg-slate-400"
                >
                    {buscando ? 'Buscando...' : 'Consultar'}
                </button>
            </div>

            <div className="space-y-4">
                {resultados.length > 0 ? (
                    resultados.map(res => {
                        const equipo = getEquipoData(res);
                        return (
                            <div key={res.id} className={`p-6 rounded-3xl border shadow-lg transition-all ${res.estado === 'Entregado' ? 'bg-slate-50 opacity-75' : 'bg-white border-blue-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                                            res.estado === 'Entregado' ? 'bg-slate-200 text-slate-600' : 
                                            res.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                            res.estado === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {res.estado}
                                        </span>
                                        <h3 className="text-xl font-black mt-2">
                                            {equipo.marca} {equipo.modelo}
                                        </h3>
                                        {equipo.cliente && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                Cliente: {equipo.cliente.nombre} - {equipo.cliente.telefono}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-blue-600 font-bold text-lg">${Number(res.costo_estimado).toLocaleString()}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-slate-500 text-sm">
                                        <span className="font-bold text-slate-700">Falla reportada:</span> {res.descripcion_falla || 'No especificada'}
                                    </p>
                                    {res.diagnostico_tecnico && (
                                        <p className="text-slate-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <span className="font-bold text-blue-800">Diagnóstico Técnico:</span> {res.diagnostico_tecnico}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    query && !buscando ? (
                        <p className="text-center text-slate-400 italic">
                            No se encontraron equipos asociados a la cédula: <span className="font-bold text-slate-600">{query}</span>
                        </p>
                    ) : (
                        <p className="text-center text-slate-400 italic">
                            Ingresa tu cédula para consultar el estado de tus equipos
                        </p>
                    )
                )}
            </div>
        </div>
    );
}