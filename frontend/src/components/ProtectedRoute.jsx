import { useState } from 'react';
import Admin from '../views/Admin';

export default function ProtectedRoute() {
    const [isAuth, setIsAuth] = useState(false);
    const [pass, setPass] = useState('');

    const handleLogin = (e) => {
        e.preventDefault(); // Evita que la página se recargue
        
        const MASTER_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

        if (pass === MASTER_PASSWORD) {
            setIsAuth(true);
        } else {
            alert("Contraseña incorrecta ❌");
        }
    };

    if (!isAuth) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                {/* Usamos un FORM con onSubmit para que funcione también al dar Enter */}
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200">
                    <h2 className="text-xl font-black mb-4 text-slate-800">Acceso Administrativo</h2>
                    
                    <input 
                        type="password" 
                        placeholder="Introduce la contraseña" 
                        className="w-full p-3 bg-slate-100 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                        required
                    />

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all"
                    >
                        Entrar al Panel
                    </button>
                    
                    <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest">
                        Repair-Manager Pro Secure Mode
                    </p>
                </form>
            </div>
        );
    }

    return <Admin />;
}