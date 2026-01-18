import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Temporadas() {
    const [temporadas, setTemporadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemporada, setSelectedTemporada] = useState(null);
    const [episodios, setEpisodios] = useState([]);
    const [provaTemporada, setProvaTemporada] = useState(null);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemporadas();
    }, []);

    const fetchTemporadas = async () => {
        try {
            const response = await api.get('/temporadas');
            setTemporadas(response.data);
            if (response.data.length > 0) {
                setSelectedTemporada(response.data[0]);
                fetchEpisodios(response.data[0].id);
                fetchProvaTemporada(response.data[0].id);
            }
        } catch (error) {
            console.error('Erro ao buscar temporadas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEpisodios = async (temporadaId) => {
        try {
            const response = await api.get(`/episodios?temporada_id=${temporadaId}`);
            setEpisodios(response.data);
        } catch (error) {
            console.error('Erro ao buscar episódios:', error);
        }
    };

    const fetchProvaTemporada = async (temporadaId) => {
        try {
            const response = await api.get('/provas');
            const prova = response.data.find(p => p.temporada_id === temporadaId);
            setProvaTemporada(prova || null);
        } catch (error) {
            console.error('Erro ao buscar prova:', error);
            setProvaTemporada(null);
        }
    };

    const handleTemporadaClick = (temporada) => {
        setSelectedTemporada(temporada);
        fetchEpisodios(temporada.id);
        fetchProvaTemporada(temporada.id);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-aec-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando temporadas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800 py-2 px-3 rounded-xl transition-colors"
                        >
                            <div className="bg-slate-800 group-hover:bg-aec-pink p-1.5 rounded-lg transition-colors">
                                <span className="text-white text-xl">←</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-sm text-slate-300 group-hover:text-white">Voltar ao Menu</span>
                                <span className="text-[10px] text-aec-pink uppercase tracking-widest font-bold">Next Level</span>
                            </div>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                <span className="text-sm text-slate-300">{user?.name || 'Usuário'}</span>
                                <div className="w-8 h-8 bg-aec-pink rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar - Temporadas */}
                <aside className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span>📚</span> Temporadas
                        </h2>

                        {temporadas.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="text-5xl mb-4 block">📭</span>
                                <p className="text-slate-400 text-sm">Nenhuma temporada disponível</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {temporadas.map((temporada) => (
                                    <button
                                        key={temporada.id}
                                        onClick={() => handleTemporadaClick(temporada)}
                                        className={`w-full p-4 rounded-xl border transition-all text-left group ${selectedTemporada?.id === temporada.id
                                            ? 'bg-aec-pink/10 border-aec-pink/50'
                                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/80 hover:border-aec-pink/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${selectedTemporada?.id === temporada.id
                                                ? 'bg-aec-pink text-white'
                                                : 'bg-slate-800 text-slate-400 group-hover:bg-aec-pink/20'
                                                }`}>
                                                {temporada.numero}
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold ${selectedTemporada?.id === temporada.id
                                                    ? 'text-aec-pink'
                                                    : 'text-slate-300'
                                                    }`}>
                                                    {temporada.titulo}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {temporada.total_episodios || 0} episódios
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main - Episódios */}
                <div className="lg:col-span-8">
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        {selectedTemporada ? (
                            <>
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                                    <div className="w-16 h-16 bg-gradient-to-br from-aec-pink to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                                        {selectedTemporada.numero}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">{selectedTemporada.titulo}</h1>
                                        <p className="text-sm text-slate-400 mt-1">{selectedTemporada.descricao}</p>
                                    </div>
                                </div>

                                {episodios.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-5xl mb-4 block">🎧</span>
                                        <p className="text-slate-400">Nenhum episódio nesta temporada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {episodios.map((episodio, index) => (
                                            <div
                                                key={episodio.id}
                                                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:bg-slate-800/80 hover:border-aec-pink/30 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center group-hover:bg-aec-pink group-hover:border-aec-pink transition-colors">
                                                        <span className="text-slate-300 group-hover:text-white">▶️</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-slate-300 group-hover:text-white">
                                                            {String(index + 1).padStart(2, '0')}. {episodio.titulo}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {episodio.duracao ? `${Math.floor(episodio.duracao / 60)} min` : 'Duração desconhecida'}
                                                        </p>
                                                    </div>
                                                    <div className="text-slate-500 group-hover:text-aec-pink">
                                                        →
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Card de Prova */}
                                        {provaTemporada && (
                                            <div className="mt-6 pt-6 border-t border-slate-800">
                                                <button
                                                    onClick={() => navigate(`/prova/${provaTemporada.id}`)}
                                                    className="w-full p-5 rounded-2xl bg-gradient-to-r from-aec-pink/20 to-purple-600/20 border border-aec-pink/30 hover:from-aec-pink/30 hover:to-purple-600/30 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-aec-pink to-purple-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
                                                            📝
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <h3 className="font-bold text-white text-lg">{provaTemporada.titulo}</h3>
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                {provaTemporada.tentativas_permitidas} tentativas • Nota mínima: {provaTemporada.nota_minima_aprovacao}%
                                                            </p>
                                                        </div>
                                                        <div className="text-aec-pink font-bold group-hover:translate-x-1 transition-transform">
                                                            Fazer Prova →
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <span className="text-5xl mb-4 block">📖</span>
                                <p className="text-slate-400">Selecione uma temporada para ver os episódios</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
