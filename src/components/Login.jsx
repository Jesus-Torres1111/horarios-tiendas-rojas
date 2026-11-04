import { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { verifyPassword, setKey } from '../utils/storage';

const VALID_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await verifyPassword(password);
    let isValid = result === 'ok';
    if (result === 'offline') isValid = (await hashPassword(password)) === VALID_HASH;
    if (isValid) {
      setKey(password);
      onLogin();
    } else {
      setError(true);
      setPassword('');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center justify-center p-4 font-sans selection:bg-red-100 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#d50000] rounded-full blur-[180px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600 rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#d50000] to-red-800 rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-red-900/20">
            <Lock size={36} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center leading-tight">
            Horarios <br/><span className="text-[#d50000]">Tiendas Rojas</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-bold text-center flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#d50000]"/> Acceso seguro al panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Contraseña de administrador"
              className={`w-full px-5 py-4 rounded-2xl border-2 text-sm font-bold focus:outline-none transition-all ${
                error
                  ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300'
                  : 'border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:bg-white text-slate-900 placeholder-slate-400'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-[11px] font-black uppercase tracking-widest mt-2 ml-2 fade-in">
                Contraseña incorrecta
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length === 0}
            className="w-full bg-[#d50000] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-red-600/20 disabled:shadow-none mt-2"
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            <ArrowRight size={18} strokeWidth={3}/>
          </button>
        </form>
      </div>

      <div className="mt-12 text-slate-400 text-[10px] font-black tracking-widest uppercase z-10">
        Sistema de Gestión Interna
      </div>
    </div>
  );
}