import { useState } from 'react';
import { tallerService } from '../api/tallerService';

/** 
 * COMPONENTES DE CELDAS EDITABLES
 * Permiten la edición rápida de diagnóstico, costos y repuestos directamente 
 * desde la tabla sin necesidad de abrir formularios adicionales.
 */
export function EditableDiagnostico({ id, valorInicial, onSave }) {
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
            <button onClick={async (e) => { e.preventDefault(); await guardar(); }} className="mt-1 bg-blue-600 text-white text-[10px] px-2 py-1 rounded">✓ GUARDAR</button>
        </div>
    );
    return (
        <div onClick={() => setEditando(true)} className="cursor-pointer p-2 rounded hover:bg-blue-50 transition-all min-h-[40px]">
            {valorInicial ? <p className="text-[12px] font-semibold text-blue-700 leading-tight">🛠️ {valorInicial}</p> : <span className="text-[12px] text-slate-400 italic">+ Diagnosticar</span>}
        </div>
    );
}

export function EditableCosto({ id, valorInicial, onSave }) {
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
        <input autoFocus type="number" className="w-24 text-[12px] p-1 border-2 border-green-500 rounded font-bold outline-none" value={monto} onChange={(e) => setMonto(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === 'Enter' && guardar()} />
    );
    return <div onClick={() => setEditando(true)} className="cursor-pointer p-2 rounded hover:bg-green-50 font-black text-green-600 text-[12px] text-center">${Number(valorInicial || 0).toLocaleString()}</div>;
}

export function EditableRepuesto({ id, valorInicial, onSave }) {
    const [editando, setEditando] = useState(false);
    const [monto, setMonto] = useState(valorInicial ?? '');

    const guardar = async () => {
        try {
            const value = parseFloat(monto) || 0;
            await tallerService.actualizarReparacion(id, { precio_repuesto: value });
            setEditando(false);
            if (typeof onSave === 'function') onSave(id, value);
        } catch (err) { alert("Error al guardar precio de repuesto."); }
    };

    if (editando) return (
        <input autoFocus type="number" className="w-24 text-[12px] p-1 border-2 border-amber-500 rounded font-bold outline-none" value={monto} onChange={(e) => setMonto(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === 'Enter' && guardar()} />
    );

    const displayValue = (valorInicial === null || valorInicial === undefined)
        ? '---'
        : `$${Number(valorInicial).toLocaleString()}`;

    return <div onClick={() => setEditando(true)} className="cursor-pointer p-2 rounded hover:bg-amber-50 font-black text-amber-600 text-[12px] text-center">{displayValue}</div>;
}
