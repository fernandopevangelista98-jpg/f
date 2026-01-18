import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Prova() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [prova, setProva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [respostas, setRespostas] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [tempoRestante, setTempoRestante] = useState(null);
    const [perguntaAtual, setPerguntaAtual] = useState(0);

    useEffect(() => {
        fetchProva();
    }, [id]);

    // Timer
    useEffect(() => {
        if (!prova?.tempo_limite || resultado) return;

        const tempoInicial = prova.tempo_limite * 60; // Converter para segundos
        setTempoRestante(tempoInicial);

        const interval = setInterval(() => {
            setTempoRestante(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleEnviar(); // Auto-submit quando acabar o tempo
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [prova?.tempo_limite, resultado]);

    const fetchProva = async () => {
        try {
            const response = await api.get(`/provas/${id}`);
            setProva(response.data);

            if (response.data.bloqueado) {
                // Buscar histórico se já passou
                const historico = await api.get(`/provas/${id}/resultado`);
                if (historico.data.length > 0 && historico.data[0].aprovado) {
                    setResultado(historico.data[0]);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar prova:', error);
            navigate('/temporadas');
        } finally {
            setLoading(false);
        }
    };

    const handleResposta = (perguntaId, opcaoId) => {
        setRespostas(prev => ({
            ...prev,
            [perguntaId]: opcaoId
        }));
    };

    const handleEnviar = async () => {
        if (enviando) return;

        // Verificar se todas foram respondidas
        const totalPerguntas = prova.perguntas?.length || 0;
        const totalRespondidas = Object.keys(respostas).length;

        if (totalRespondidas < totalPerguntas) {
            const confirmar = confirm(`Você respondeu ${totalRespondidas} de ${totalPerguntas} perguntas. Deseja enviar mesmo assim?`);
            if (!confirmar) return;
        }

        setEnviando(true);
        try {
            const response = await api.post(`/provas/${id}/responder`, {
                respostas: respostas
            });
            setResultado(response.data);
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao enviar respostas');
        } finally {
            setEnviando(false);
        }
    };

    const handleDownloadCertificado = async () => {
        if (!resultado?.aprovado) return;

        try {
            const response = await api.get(`/provas/${id}/certificado/${resultado.id}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificado-${prova.titulo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Erro ao baixar certificado');
        }
    };

    const formatarTempo = (segundos) => {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-aec-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando prova...</p>
                </div>
            </div>
        );
    }

    // Tela de resultado
    if (resultado) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center">
                    {resultado.aprovado ? (
                        <>
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-5xl">🎉</span>
                            </div>
                            <h1 className="text-3xl font-bold text-green-400 mb-2">Parabéns!</h1>
                            <p className="text-slate-400 mb-6">Você foi aprovado na prova!</p>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-5xl">😔</span>
                            </div>
                            <h1 className="text-3xl font-bold text-red-400 mb-2">Não foi dessa vez</h1>
                            <p className="text-slate-400 mb-6">Tente novamente!</p>
                        </>
                    )}

                    <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-white">{resultado.pontuacao?.toFixed(1)}%</p>
                                <p className="text-xs text-slate-400 mt-1">Nota</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-400">{resultado.acertos || 0}</p>
                                <p className="text-xs text-slate-400 mt-1">Acertos</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-red-400">{resultado.erros || 0}</p>
                                <p className="text-xs text-slate-400 mt-1">Erros</p>
                            </div>
                        </div>
                    </div>

                    {/* Feedback das perguntas */}
                    {resultado.perguntas && resultado.perguntas.length > 0 && (
                        <div className="text-left mb-6 max-h-60 overflow-y-auto">
                            <h3 className="font-bold text-white mb-3">Revisão das questões:</h3>
                            <div className="space-y-3">
                                {resultado.perguntas.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className={`p-3 rounded-xl border ${p.acertou
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-red-500/10 border-red-500/30'
                                            }`}
                                    >
                                        <p className="text-sm text-slate-300">
                                            <span className={p.acertou ? 'text-green-400' : 'text-red-400'}>
                                                {p.acertou ? '✓' : '✗'}
                                            </span>
                                            {' '}{idx + 1}. {p.enunciado.substring(0, 80)}...
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {resultado.aprovado && (
                            <button
                                onClick={handleDownloadCertificado}
                                className="w-full py-4 bg-gradient-to-r from-aec-pink to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                📜 Baixar Certificado
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/temporadas')}
                            className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            Voltar às Temporadas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Verificar se está bloqueada
    if (prova?.bloqueado) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center">
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">🔒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-yellow-400 mb-2">Prova Bloqueada</h1>
                    <p className="text-slate-400 mb-6">
                        Complete todos os episódios da temporada para liberar esta prova.
                    </p>
                    <button
                        onClick={() => navigate('/temporadas')}
                        className="px-8 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        Voltar às Temporadas
                    </button>
                </div>
            </div>
        );
    }

    const pergunta = prova?.perguntas?.[perguntaAtual];
    const totalPerguntas = prova?.perguntas?.length || 0;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="font-bold text-white">{prova?.titulo}</h1>
                            <p className="text-xs text-slate-400">
                                Tentativas restantes: {prova?.tentativas_restantes}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {tempoRestante !== null && (
                                <div className={`px-4 py-2 rounded-xl font-mono font-bold ${tempoRestante < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-white'
                                    }`}>
                                    ⏱️ {formatarTempo(tempoRestante)}
                                </div>
                            )}
                            <div className="text-slate-400 text-sm">
                                {perguntaAtual + 1} / {totalPerguntas}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress bar */}
            <div className="h-1 bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-aec-pink to-purple-600 transition-all duration-300"
                    style={{ width: `${((perguntaAtual + 1) / totalPerguntas) * 100}%` }}
                />
            </div>

            {/* Conteúdo da pergunta */}
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8">
                        {/* Enunciado */}
                        <div className="mb-8">
                            <span className="text-aec-pink text-sm font-bold mb-3 block">
                                Questão {perguntaAtual + 1}
                            </span>
                            <h2 className="text-xl text-white font-medium leading-relaxed">
                                {pergunta?.enunciado}
                            </h2>
                        </div>

                        {/* Opções */}
                        <div className="space-y-3 mb-8">
                            {pergunta?.opcoes?.map((opcao) => (
                                <button
                                    key={opcao.id}
                                    onClick={() => handleResposta(pergunta.id, opcao.id)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${respostas[pergunta.id] === opcao.id
                                        ? 'bg-aec-pink/20 border-aec-pink text-white'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${respostas[pergunta.id] === opcao.id
                                        ? 'bg-aec-pink text-white'
                                        : 'bg-slate-700 text-slate-400'
                                        }`}>
                                        {opcao.ordem}
                                    </div>
                                    <span>{opcao.texto}</span>
                                </button>
                            ))}
                        </div>

                        {/* Navegação */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPerguntaAtual(prev => Math.max(0, prev - 1))}
                                disabled={perguntaAtual === 0}
                                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Anterior
                            </button>

                            {perguntaAtual < totalPerguntas - 1 ? (
                                <button
                                    onClick={() => setPerguntaAtual(prev => prev + 1)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Próxima →
                                </button>
                            ) : (
                                <button
                                    onClick={handleEnviar}
                                    disabled={enviando}
                                    className="flex-1 py-3 bg-gradient-to-r from-aec-pink to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {enviando ? 'Enviando...' : '✓ Finalizar Prova'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navegação rápida */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        {prova?.perguntas?.map((p, idx) => (
                            <button
                                key={p.id}
                                onClick={() => setPerguntaAtual(idx)}
                                className={`w-10 h-10 rounded-lg font-bold transition-all ${perguntaAtual === idx
                                    ? 'bg-aec-pink text-white'
                                    : respostas[p.id]
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
