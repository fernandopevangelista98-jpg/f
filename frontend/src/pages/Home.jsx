import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { signed, user } = useAuth();
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(false);

    const handleStart = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (signed) {
                navigate('/temporadas');
            } else {
                navigate('/login');
            }
        }, 700);
    };

    return (
        <section className={`relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isAnimating ? '-translate-y-full opacity-0' : ''}`}>
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=2694&auto=format&fit=crop"
                    alt="Background Cover"
                    className="w-full h-full object-cover opacity-30 blur-sm scale-105 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-aec-pink/10"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center animate-fade-in">
                {/* Album Cover */}
                <div className="mb-10 p-1.5 rounded-2xl bg-gradient-to-br from-aec-pink to-purple-600 shadow-2xl shadow-aec-pink/40 transform hover:scale-105 transition-transform duration-500">
                    <div className="rounded-xl overflow-hidden w-72 h-72 md:w-96 md:h-96 relative group shadow-inner bg-black">
                        <img
                            src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000&auto=format&fit=crop"
                            alt="Podcast Next Level Cover"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-left">
                            <p className="text-xs font-bold text-aec-pink uppercase tracking-widest bg-black/50 px-2 py-1 rounded inline-block mb-2 border border-aec-pink/30">
                                Original AeC
                            </p>
                            <h2 className="text-4xl font-black text-white leading-none">
                                NEXT<br />LEVEL
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                    PODCAST <span className="text-transparent bg-clip-text bg-gradient-to-r from-aec-pink to-purple-500">NEXT LEVEL</span>
                </h1>

                <p className="text-slate-400 max-w-lg text-lg mb-10 leading-relaxed font-light">
                    Sua jornada de transformação para Analista de Qualidade. <br />
                    <span className="text-aec-pink font-semibold">
                        {signed ? `Bem-vindo, ${user?.name || 'Aluno'}!` : 'Temporada 0: O Início.'}
                    </span>
                </p>

                {/* CTA Button */}
                <button
                    onClick={handleStart}
                    className="group relative px-10 py-5 bg-aec-pink hover:bg-aec-pinkDark rounded-full font-bold text-lg shadow-lg shadow-pink-900/50 transition-all hover:shadow-pink-600/50 flex items-center gap-3 overflow-hidden transform active:scale-95"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="text-3xl group-hover:rotate-12 transition-transform">▶️</span>
                    <span>{signed ? 'CONTINUAR JORNADA' : 'INICIAR JORNADA'}</span>
                </button>

                {/* Status */}
                <p className="mt-8 text-xs text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Disponível agora
                </p>
            </div>
        </section>
    );
}
