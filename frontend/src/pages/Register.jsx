import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Opções de Cargo
const CARGOS = [
    'ATENDENTE',
    'AUXILIAR',
    'MONITOR',
    'SUPERVISOR',
    'COORDENADOR',
    'GERENTE',
    'SUPERINTENDENTE',
    'DIRETOR',
    'VP'
];

// Opções de Área
const AREAS = [
    'QUALIDADE',
    'PLANEJAMENTO',
    'OPERAÇÃO',
    'TREINAMENTO',
    'OUTRAS'
];

export default function Register() {
    const [formData, setFormData] = useState({
        nome_completo: '',
        email: '',
        matricula_aec: '',
        cargo: '',
        area: '',
        senha: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.senha !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (!formData.cargo || !formData.area) {
            setError('Selecione cargo e área');
            return;
        }

        setLoading(true);

        const result = await register({
            nome_completo: formData.nome_completo,
            email: formData.email,
            matricula_aec: formData.matricula_aec,
            cargo: formData.cargo,
            area: formData.area,
            senha: formData.senha
        });

        if (result.success) {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-20 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-purple-500/10"></div>
            </div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <div className="inline-block p-1.5 rounded-2xl bg-gradient-to-br from-purple-500 to-aec-pink mb-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center">
                                <span className="text-3xl">🚀</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-white">
                            CRIAR <span className="text-aec-pink">CONTA</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Comece sua jornada Next Level</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
                            ✅ Cadastro realizado! Aguarde aprovação do admin...
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nome e Matrícula */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Nome completo
                                </label>
                                <input
                                    type="text"
                                    name="nome_completo"
                                    value={formData.nome_completo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Matrícula AeC
                                </label>
                                <input
                                    type="text"
                                    name="matricula_aec"
                                    value={formData.matricula_aec}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm"
                                    placeholder="Ex: 123456"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        {/* Cargo e Área */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Cargo
                                </label>
                                <select
                                    name="cargo"
                                    value={formData.cargo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" className="bg-slate-900">Selecione...</option>
                                    {CARGOS.map(cargo => (
                                        <option key={cargo} value={cargo} className="bg-slate-900">
                                            {cargo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Área
                                </label>
                                <select
                                    name="area"
                                    value={formData.area}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" className="bg-slate-900">Selecione...</option>
                                    {AREAS.map(area => (
                                        <option key={area} value={area} className="bg-slate-900">
                                            {area}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Senhas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Confirmar senha
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-aec-pink focus:ring-1 focus:ring-aec-pink transition-colors text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-aec-pink rounded-xl font-bold text-white shadow-lg hover:shadow-purple-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <span>CADASTRAR</span>
                                    <span>🚀</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            Já tem conta?{' '}
                            <Link to="/login" className="text-aec-pink hover:underline font-semibold">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
