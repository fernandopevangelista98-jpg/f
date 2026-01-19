import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [temporadas, setTemporadas] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, temporadasRes] = await Promise.all([
                api.get('/dashboard/stats').catch(() => ({ data: null })),
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/temporadas').catch(() => ({ data: [] }))
            ]);

            setStats(statsRes.data);

            // Defensive array handling - API might return object with items/data or direct array
            let usersArray = usersRes.data;
            if (usersArray && !Array.isArray(usersArray)) {
                usersArray = usersArray.items || usersArray.data || usersArray.users || [];
            }
            usersArray = Array.isArray(usersArray) ? usersArray : [];

            let temporadasArray = temporadasRes.data;
            if (temporadasArray && !Array.isArray(temporadasArray)) {
                temporadasArray = temporadasArray.items || temporadasArray.data || temporadasArray.temporadas || [];
            }
            temporadasArray = Array.isArray(temporadasArray) ? temporadasArray : [];

            setUsers(usersArray);
            setPendingUsers(usersArray.filter(u => u.status === 'pendente'));
            setTemporadas(temporadasArray);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setUsers([]);
            setPendingUsers([]);
            setTemporadas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.patch(`/users/${userId}/approve`, { acao: 'aprovar' });
            fetchData();
        } catch (error) {
            alert('Erro ao aprovar usuário');
        }
    };

    const handleReject = async (userId) => {
        try {
            await api.patch(`/users/${userId}/approve`, { acao: 'recusar' });
            fetchData();
        } catch (error) {
            alert('Erro ao recusar usuário');
        }
    };

    const handleSaveUser = async (user) => {
        try {
            await api.put(`/users/${user.id}`, user);
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Erro ao salvar as alterações do usuário');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await api.delete(`/users/${userId}`);
            fetchData();
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            alert('Erro ao deletar o usuário');
        }
    };

    // --- Season Handlers ---
    const handleCreateSeason = async (seasonData) => {
        try {
            await api.post('/temporadas', seasonData);
            fetchData();
        } catch (error) {
            console.error('Erro ao criar temporada:', error);
            alert('Erro ao criar temporada');
        }
    };

    const handleUpdateSeason = async (seasonData) => {
        try {
            await api.put(`/temporadas/${seasonData.id}`, seasonData);
            fetchData();
        } catch (error) {
            console.error('Erro ao atualizar temporada:', error);
            alert('Erro ao atualizar temporada');
        }
    };

    const handleDuplicateSeason = async (seasonId) => {
        try {
            await api.post(`/temporadas/${seasonId}/duplicate`);
            fetchData();
        } catch (error) {
            console.error('Erro ao duplicar temporada:', error);
            alert('Erro ao duplicar temporada');
        }
    };

    const handleDeleteSeason = async (seasonId) => {
        try {
            await api.delete(`/temporadas/${seasonId}`);
            fetchData();
        } catch (error) {
            console.error('Erro ao deletar temporada:', error);
            alert('Erro ao deletar temporada');
        }
    };

    // --- Episode Handlers ---
    const handleCreateEpisode = async (episodeData) => {
        try {
            await api.post('/episodios', episodeData);
            // We don't refill everything here, the tab will handle its own refresh
            return true;
        } catch (error) {
            console.error('Erro ao criar episódio:', error);
            alert('Erro ao criar episódio');
            return false;
        }
    };

    const handleUpdateEpisode = async (episodeData) => {
        try {
            await api.put(`/episodios/${episodeData.id}`, episodeData);
            return true;
        } catch (error) {
            console.error('Erro ao atualizar episódio:', error);
            alert('Erro ao atualizar episódio');
            return false;
        }
    };

    const handleDeleteEpisode = async (episodeId) => {
        try {
            await api.delete(`/episodios/${episodeId}`);
            return true;
        } catch (error) {
            console.error('Erro ao deletar episódio:', error);
            alert('Erro ao deletar episódio');
            return false;
        }
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
                    <p className="text-slate-400">Carregando painel admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-aec-pink to-purple-600 p-2 rounded-xl">
                                <span className="text-xl">⚙️</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-white">Painel Admin</h1>
                                <p className="text-xs text-slate-400">Next Level Podcast</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {pendingUsers.length > 0 && (
                                <div className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full">
                                    <span className="text-red-400 text-sm font-bold">
                                        {pendingUsers.length} pendente(s)
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700">
                                <div className="w-8 h-8 bg-aec-pink rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.nome_completo?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <span className="text-sm text-slate-300 hidden md:block">{user?.nome_completo}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <nav className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 space-y-2">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>📊</span>
                                <span className="font-medium">Dashboard</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>👥</span>
                                <span className="font-medium">Usuários</span>
                                {pendingUsers.length > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {pendingUsers.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('temporadas')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'temporadas'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>📚</span>
                                <span className="font-medium">Temporadas</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('provas')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'provas'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>📝</span>
                                <span className="font-medium">Provas</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('relatorios')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'relatorios'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>📊</span>
                                <span className="font-medium">Relatórios</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('configuracoes')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'configuracoes'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>⚙️</span>
                                <span className="font-medium">Configurações</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'logs'
                                    ? 'bg-aec-pink/20 text-aec-pink border border-aec-pink/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span>📋</span>
                                <span className="font-medium">Logs</span>
                            </button>
                            <div className="border-t border-slate-800 my-4"></div>
                            <button
                                onClick={() => navigate('/temporadas')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                            >
                                <span>🎧</span>
                                <span className="font-medium">Ver como Aluno</span>
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {activeTab === 'dashboard' && (
                            <DashboardTab stats={stats} users={users} pendingUsers={pendingUsers} temporadas={temporadas} setActiveTab={setActiveTab} />
                        )}
                        {activeTab === 'users' && (
                            <UsersTab
                                users={users}
                                pendingUsers={pendingUsers}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onRefresh={fetchData}
                                onSave={handleSaveUser}
                                onDelete={handleDeleteUser}
                            />
                        )}
                        {activeTab === 'temporadas' && (
                            <TemporadasTab
                                temporadas={temporadas}
                                onRefresh={fetchData}
                                onCreate={handleCreateSeason}
                                onUpdate={handleUpdateSeason}
                                onDuplicate={handleDuplicateSeason}
                                onDelete={handleDeleteSeason}
                            />
                        )}
                        {activeTab === 'episodios' && (
                            <EpisodiosTab
                                temporadas={temporadas}
                                onCreate={handleCreateEpisode}
                                onUpdate={handleUpdateEpisode}
                                onDelete={handleDeleteEpisode}
                            />
                        )}
                        {activeTab === 'provas' && (
                            <ProvasTab />
                        )}
                        {activeTab === 'relatorios' && (
                            <RelatoriosTab />
                        )}
                        {activeTab === 'configuracoes' && (
                            <ConfiguracoesTab />
                        )}
                        {activeTab === 'logs' && (
                            <LogsTab />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Dashboard Tab Component with Charts
function DashboardTab({ stats, users, pendingUsers, temporadas, setActiveTab }) {
    const navigate = useNavigate();

    // Chart colors
    const COLORS = ['#be185d', '#0032A1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    // Mock data for charts (replace with real API data when available)
    const newUsersData = [
        { month: 'Ago', users: 12 },
        { month: 'Set', users: 19 },
        { month: 'Out', users: 15 },
        { month: 'Nov', users: 28 },
        { month: 'Dez', users: 24 },
        {
            month: 'Jan', users: users.filter(u => {
                const createdAt = new Date(u.created_at);
                const now = new Date();
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
            }).length || 8
        },
    ];

    // Calculate users by area
    const areaCount = users.reduce((acc, user) => {
        const area = user.area || 'Outros';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
    }, {});
    const usersByAreaData = Object.entries(areaCount).map(([name, value]) => ({ name, value }));

    // Progress by season (mock - replace with real data)
    const progressBySeasonData = temporadas.map(t => ({
        name: t.titulo?.substring(0, 15) || `Temp ${t.numero}`,
        concluidos: Math.floor(Math.random() * 40) + 10,
        emProgresso: Math.floor(Math.random() * 30) + 5,
        naoIniciados: Math.floor(Math.random() * 30) + 5,
    }));

    // Recent activity (mock - replace with real API)
    const recentActivity = [
        { type: 'Novo Cadastro', user: pendingUsers[0]?.nome_completo || 'João Silva', detail: 'Aguardando aprovação', time: 'há 5 min', icon: '👤' },
        { type: 'Prova Realizada', user: users[0]?.nome_completo || 'Maria Santos', detail: 'Nota: 8.5', time: 'há 2 horas', icon: '📝' },
        { type: 'Episódio Assistido', user: users[1]?.nome_completo || 'Pedro Costa', detail: 'Temporada 0 - Ep. 3', time: 'há 3 horas', icon: '🎧' },
        { type: 'Aprovação', user: users[2]?.nome_completo || 'Ana Lima', detail: 'Cadastro aprovado', time: 'ontem', icon: '✅' },
    ];

    const activeUsers = users.filter(u => u.status === 'ativo').length;
    const inactiveUsers = users.filter(u => u.status === 'inativo').length;
    const totalEpisodios = stats?.total_episodios || 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>

            {/* KPI Cards - Clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => navigate('/admin')}
                    className="cursor-pointer group"
                >
                    <StatCard
                        title="Usuários"
                        value={users.length}
                        icon="👥"
                        color="blue"
                        subtitle={
                            <span className="flex gap-2 text-xs">
                                <span className="text-green-400">{activeUsers} ativos</span>
                                <span className="text-yellow-400">{pendingUsers.length} pendentes</span>
                            </span>
                        }
                        badge={`+${users.filter(u => {
                            const d = new Date(u.created_at);
                            const now = new Date();
                            return (now - d) < 7 * 24 * 60 * 60 * 1000;
                        }).length} esta semana`}
                    />
                </div>
                <div
                    onClick={() => setActiveTab && setActiveTab('temporadas')}
                    className="cursor-pointer group"
                >
                    <StatCard
                        title="Conteúdo"
                        value={`${temporadas.length} | ${totalEpisodios}`}
                        icon="▶️"
                        color="purple"
                        subtitle={<span className="text-xs text-slate-400">Temporadas | Episódios</span>}
                    />
                </div>
                <div
                    onClick={() => setActiveTab && setActiveTab('provas')}
                    className="cursor-pointer group"
                >
                    <StatCard
                        title="Avaliações"
                        value={stats?.total_tentativas_provas || 0}
                        icon="🎓"
                        color="pink"
                        subtitle={
                            <span className="flex gap-2 text-xs">
                                <span className="text-green-400">{stats?.taxa_aprovacao || 78}% aprovação</span>
                            </span>
                        }
                    />
                </div>
                <StatCard
                    title="Armazenamento"
                    value={`${stats?.storage?.used_mb || 0} MB`}
                    icon="☁️"
                    color="yellow"
                    subtitle={
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                            <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${stats?.storage?.percent || 0}%` }}
                            ></div>
                        </div>
                    }
                    badge={`${stats?.storage?.percent || 0}% de 1GB`}
                />
            </div>

            {/* Pending Users Alert */}
            {pendingUsers.length > 0 && (
                <div
                    onClick={() => setActiveTab && setActiveTab('users')}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 cursor-pointer hover:bg-yellow-500/20 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-500/20 p-3 rounded-xl">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-yellow-400 text-lg">
                                {pendingUsers.length} usuário(s) aguardando aprovação
                            </h3>
                            <p className="text-yellow-400/70 text-sm">
                                Clique aqui para revisar os cadastros pendentes
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors">
                            Revisar Agora
                        </button>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Line and Bar Charts (60%) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Line Chart - New Users */}
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4">📈 Novos Usuários (6 meses)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={newUsersData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="month" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#be185d"
                                        strokeWidth={3}
                                        dot={{ fill: '#be185d', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#ec4899' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart - Progress by Season */}
                    {temporadas.length > 0 && (
                        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">📊 Progresso por Temporada</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={progressBySeasonData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" stroke="#94a3b8" />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="concluidos" stackId="a" fill="#10b981" name="Concluídos" />
                                        <Bar dataKey="emProgresso" stackId="a" fill="#f59e0b" name="Em Progresso" />
                                        <Bar dataKey="naoIniciados" stackId="a" fill="#475569" name="Não Iniciados" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Pie Chart and Summary (40%) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Pie Chart - Users by Area */}
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4">🥧 Distribuição por Área</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={usersByAreaData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {usersByAreaData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            {usersByAreaData.map((entry, index) => (
                                <span key={entry.name} className="flex items-center gap-1 text-xs text-slate-300">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    {entry.name}: {entry.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4">📊 Resumo do Sistema</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-slate-400">Usuários Ativos</span>
                                <span className="text-xl font-bold text-green-400">{activeUsers}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-slate-400">Pendentes</span>
                                <span className="text-xl font-bold text-yellow-400">{pendingUsers.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-slate-400">Inativos</span>
                                <span className="text-xl font-bold text-red-400">{inactiveUsers}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">🕐 Atividade Recente</h3>
                    <button className="text-sm text-aec-pink hover:text-pink-400 transition-colors">
                        Ver Todas →
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left p-3 text-slate-400 font-medium text-sm">Tipo</th>
                                <th className="text-left p-3 text-slate-400 font-medium text-sm">Usuário</th>
                                <th className="text-left p-3 text-slate-400 font-medium text-sm hidden md:table-cell">Detalhes</th>
                                <th className="text-left p-3 text-slate-400 font-medium text-sm">Quando</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map((activity, index) => (
                                <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                    <td className="p-3">
                                        <span className="flex items-center gap-2 text-white">
                                            <span>{activity.icon}</span>
                                            {activity.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-300">{activity.user}</td>
                                    <td className="p-3 text-slate-400 hidden md:table-cell">{activity.detail}</td>
                                    <td className="p-3 text-slate-500 text-sm">{activity.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={() => setActiveTab && setActiveTab('users')}
                    className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-2xl p-6 cursor-pointer hover:from-green-500/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="text-2xl">✅</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-green-400">
                                {pendingUsers.length} pendentes
                            </h4>
                            <p className="text-sm text-green-400/70">Aprovar cadastros</p>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => setActiveTab && setActiveTab('temporadas')}
                    className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-2xl p-6 cursor-pointer hover:from-purple-500/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="text-2xl">➕</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-purple-400">Novo Conteúdo</h4>
                            <p className="text-sm text-purple-400/70">Criar temporada</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-2xl p-6 cursor-pointer hover:from-blue-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-400">Exportar</h4>
                            <p className="text-sm text-blue-400/70">Gerar relatório</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon, color, subtitle, badge }) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
        pink: 'from-aec-pink/20 to-aec-pink/5 border-aec-pink/30 text-aec-pink',
        green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {badge && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{title}</p>
            {subtitle && <div className="mt-2">{subtitle}</div>}
        </div>
    );
}

// Users Tab Component - Enhanced with Filters, Modals, and Actions
function UsersTab({ users, pendingUsers, onApprove, onReject, onRefresh, onSave, onDelete }) {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState('all');
    const [cargoFilter, setCargoFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [actionMenuOpen, setActionMenuOpen] = useState(null);
    const itemsPerPage = 10;

    // Get unique areas and cargos for filters
    const areas = [...new Set(users.map(u => u.area).filter(Boolean))];
    const cargos = [...new Set(users.map(u => u.cargo).filter(Boolean))];

    // Filter users
    const filteredUsers = users.filter(u => {
        const matchesStatus = filter === 'all' || u.status === filter;
        const matchesSearch = !searchTerm ||
            u.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = areaFilter === 'all' || u.area === areaFilter;
        const matchesCargo = cargoFilter === 'all' || u.cargo === cargoFilter;
        return matchesStatus && matchesSearch && matchesArea && matchesCargo;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(paginatedUsers.map(u => u.id));
        }
    };

    const toggleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    // Action handlers
    const openDetails = (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
        setActionMenuOpen(null);
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
        setActionMenuOpen(null);
    };

    const openDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
        setActionMenuOpen(null);
    };

    const clearFilters = () => {
        setFilter('all');
        setSearchTerm('');
        setAreaFilter('all');
        setCargoFilter('all');
        setCurrentPage(1);
    };

    const activeFiltersCount = [filter !== 'all', searchTerm, areaFilter !== 'all', cargoFilter !== 'all'].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
                    <p className="text-slate-400 text-sm">Total: {users.length} usuários cadastrados</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        🔄 Atualizar
                    </button>
                    <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors">
                        📥 Exportar
                    </button>
                </div>
            </div>

            {/* Pending Users Alert */}
            {pendingUsers.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⏳</span>
                            <div>
                                <p className="font-bold text-yellow-400">{pendingUsers.length} usuário(s) aguardando aprovação</p>
                                <p className="text-sm text-yellow-400/70">Clique para revisar</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilter('pendente')}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors"
                        >
                            Ver Pendentes
                        </button>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-aec-pink focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                    >
                        <option value="all">Todos Status</option>
                        <option value="ativo">✅ Ativo</option>
                        <option value="pendente">⏳ Pendente</option>
                        <option value="inativo">❌ Inativo</option>
                    </select>

                    {/* Area Filter */}
                    <select
                        value={areaFilter}
                        onChange={(e) => { setAreaFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                    >
                        <option value="all">Todas Áreas</option>
                        {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>

                    {/* Cargo Filter */}
                    <select
                        value={cargoFilter}
                        onChange={(e) => { setCargoFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                    >
                        <option value="all">Todos Cargos</option>
                        {cargos.map(cargo => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                        ))}
                    </select>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-2"
                        >
                            ✕ Limpar ({activeFiltersCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.length > 0 && (
                <div className="bg-aec-pink/20 border border-aec-pink/30 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-aec-pink font-medium">{selectedUsers.length} usuário(s) selecionado(s)</span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600">
                            ✓ Aprovar
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600">
                            ✕ Desativar
                        </button>
                        <button
                            onClick={() => setSelectedUsers([])}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-800/50">
                            <th className="p-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-aec-pink focus:ring-aec-pink"
                                />
                            </th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Usuário</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden md:table-cell">Matrícula</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden lg:table-cell">Cargo</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden lg:table-cell">Área</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${selectedUsers.includes(user.id) ? 'bg-aec-pink/10' : ''}`}>
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => toggleSelectUser(user.id)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-aec-pink focus:ring-aec-pink"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.status === 'ativo' ? 'bg-green-500/20 text-green-400' :
                                            user.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {user.nome_completo?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{user.nome_completo}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-300 hidden md:table-cell">{user.matricula_aec || '-'}</td>
                                <td className="p-4 text-slate-300 hidden lg:table-cell">{user.cargo || '-'}</td>
                                <td className="p-4 hidden lg:table-cell">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">{user.area || '-'}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'ativo' ? 'bg-green-500/20 text-green-400' :
                                        user.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            ⋮
                                        </button>
                                        {actionMenuOpen === user.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 py-2">
                                                <button onClick={() => openDetails(user)} className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                                    👁️ Ver Detalhes
                                                </button>
                                                <button onClick={() => openEdit(user)} className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                                    ✏️ Editar
                                                </button>
                                                {user.status === 'pendente' && (
                                                    <button onClick={() => { onApprove(user.id); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-green-400 hover:bg-slate-700 flex items-center gap-2">
                                                        ✅ Aprovar
                                                    </button>
                                                )}
                                                <button onClick={() => openDelete(user)} className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center gap-2">
                                                    🗑️ Deletar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                        >
                            ← Anterior
                        </button>
                        <span className="px-3 py-1 bg-aec-pink text-white rounded-lg">{currentPage}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                        >
                            Próximo →
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${selectedUser.status === 'ativo' ? 'bg-green-500/20 text-green-400' :
                                    selectedUser.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {selectedUser.nome_completo?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedUser.nome_completo}</h3>
                                    <p className="text-slate-400">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Matrícula</p>
                                <p className="text-white font-medium">{selectedUser.matricula_aec || '-'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Área</p>
                                <p className="text-white font-medium">{selectedUser.area || '-'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Cargo</p>
                                <p className="text-white font-medium">{selectedUser.cargo || '-'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.status === 'ativo' ? 'bg-green-500/20 text-green-400' :
                                    selectedUser.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>{selectedUser.status}</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Perfil</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.perfil === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'
                                    }`}>{selectedUser.perfil}</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Cadastro</p>
                                <p className="text-white font-medium">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowDetailsModal(false); openEdit(selectedUser); }} className="flex-1 py-3 bg-aec-pink text-white rounded-xl hover:bg-pink-600 transition-colors font-medium">
                                ✏️ Editar Usuário
                            </button>
                            <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-6">Editar Usuário</h3>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Nome Completo</label>
                                <input type="text" defaultValue={selectedUser.nome_completo} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Email</label>
                                <input type="email" defaultValue={selectedUser.email} disabled className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-500 cursor-not-allowed" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Área</label>
                                    <select defaultValue={selectedUser.area} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none">
                                        <option value="Qualidade">Qualidade</option>
                                        <option value="TI">TI</option>
                                        <option value="RH">RH</option>
                                        <option value="Comercial">Comercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Cargo</label>
                                    <select defaultValue={selectedUser.cargo} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none">
                                        <option value="Analista">Analista</option>
                                        <option value="Coordenador">Coordenador</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Gerente">Gerente</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Status</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-slate-300">
                                        <input type="radio" name="status" value="ativo" defaultChecked={selectedUser.status === 'ativo'} className="text-aec-pink" />
                                        Ativo
                                    </label>
                                    <label className="flex items-center gap-2 text-slate-300">
                                        <input type="radio" name="status" value="inativo" defaultChecked={selectedUser.status === 'inativo'} className="text-aec-pink" />
                                        Inativo
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const form = e.target.closest('form');
                                        const updatedUser = {
                                            ...selectedUser,
                                            nome_completo: form.querySelector('input[type="text"]').value,
                                            area: form.querySelector('select:nth-of-type(1)').value,
                                            cargo: form.querySelector('select:nth-of-type(2)').value,
                                            status: form.querySelector('input[name="status"]:checked').value
                                        };
                                        onSave(updatedUser);
                                        setShowEditModal(false);
                                    }}
                                    className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-2">⚠️ Confirmar Exclusão</h3>
                        <p className="text-slate-400 mb-4">Esta ação é <span className="text-red-400 font-bold">IRREVERSÍVEL</span>. Deletar o usuário irá:</p>
                        <ul className="list-disc list-inside text-red-400 text-sm mb-4 space-y-1">
                            <li>Remover todos os dados pessoais</li>
                            <li>Excluir progresso de episódios</li>
                            <li>Excluir resultados de provas</li>
                            <li>Excluir certificados emitidos</li>
                        </ul>
                        <p className="text-slate-300 mb-4">Você está prestes a deletar: <span className="text-white font-bold">{selectedUser.nome_completo}</span></p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600">
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(selectedUser.id);
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                            >
                                Deletar Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Temporadas Tab Component - Enhanced for Sprint 3
function TemporadasTab({ temporadas, onRefresh, onCreate, onUpdate, onDuplicate, onDelete }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [seasonStats, setSeasonStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        ordem: 1,
        mantra: '',
        status: 'rascunho',
        capa_url: '' // Placeholder for future R2 integration
    });

    const openCreateModal = () => {
        setFormData({
            nome: '',
            descricao: '',
            ordem: temporadas.length + 1,
            mantra: '',
            status: 'rascunho',
            capa_url: ''
        });
        setShowCreateModal(true);
    };

    const openEditModal = (season) => {
        setSelectedSeason(season);
        setFormData({
            ...season,
            capa_url: season.capa_url || ''
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (season) => {
        setSelectedSeason(season);
        setShowDeleteModal(true);
    };

    const openStatsModal = async (season) => {
        setSelectedSeason(season);
        setLoadingStats(true);
        setShowStatsModal(true);
        try {
            // Fetch detailed season data which includes episodes
            // Note: The list view endpoint doesn't return episodes, so we need detailed view
            const response = await api.get(`/temporadas/${season.id}`);
            const detailedSeason = response.data;

            // Calculate basic stats on client side for now
            const totalEpisodios = detailedSeason.episodios ? detailedSeason.episodios.length : 0;
            const publishedEpisodios = detailedSeason.episodios ? detailedSeason.episodios.filter(e => e.status === 'publicado').length : 0;
            const totalDuration = detailedSeason.episodios ? detailedSeason.episodios.reduce((acc, curr) => acc + (curr.duracao || 0), 0) : 0;

            setSeasonStats({
                totalEpisodios,
                publishedEpisodios,
                totalDuration,
                episodios: detailedSeason.episodios || []
            });
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
            alert("Erro ao carregar detalhes da temporada.");
            setShowStatsModal(false);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSubmitCreate = (e) => {
        e.preventDefault();
        onCreate(formData);
        setShowCreateModal(false);
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        onUpdate({ ...formData, id: selectedSeason.id });
        setShowEditModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Temporadas</h2>
                    <p className="text-slate-400 text-sm">Gerencie as temporadas do podcast</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium flex items-center gap-2"
                >
                    <span>+</span> Nova Temporada
                </button>
            </div>

            {temporadas.length === 0 ? (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <span className="text-5xl mb-4 block">📚</span>
                    <p className="text-slate-400">Nenhuma temporada cadastrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {temporadas.map(temp => (
                        <div key={temp.id} className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 group hover:border-slate-700 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-aec-pink to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        {temp.ordem}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{temp.nome}</h3>
                                        <div className={`text-xs px-2 py-0.5 rounded-full w-fit mt-1 ${temp.status === 'publicado'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {temp.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative flex items-center gap-1">
                                    <button
                                        onClick={() => openStatsModal(temp)}
                                        className="p-2 text-slate-400 hover:text-aec-pink hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Estatísticas"
                                    >
                                        📊
                                    </button>
                                    <button
                                        onClick={() => openEditModal(temp)}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">
                                {temp.descricao || 'Sem descrição definida.'}
                            </p>

                            <div className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3">
                                "{temp.mantra || 'Sem mantra definido'}"
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex items-center gap-2 mt-auto">
                                <button
                                    onClick={() => onDuplicate(temp.id)}
                                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm transition-colors"
                                >
                                    Duplicar
                                </button>
                                <button
                                    onClick={() => openDeleteModal(temp)}
                                    className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm transition-colors"
                                    title="Excluir"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Estatísticas (Sprint 3 + Sprint 6 Preview) */}
            {showStatsModal && selectedSeason && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                📊 Estatísticas da Temporada
                            </h3>
                            <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {loadingStats ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-8 h-8 border-2 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : seasonStats && (
                            <div className="space-y-6">
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                    <h4 className="text-aec-pink font-bold text-lg mb-1">{selectedSeason.nome}</h4>
                                    <p className="text-sm text-slate-400">{selectedSeason.descricao}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-white mb-1">{seasonStats.totalEpisodios}</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Episódios Totais</div>
                                    </div>
                                    <div className="bg-slate-800 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-green-400 mb-1">{seasonStats.publishedEpisodios}</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Publicados</div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Últimos Episódios</h5>
                                    {seasonStats.episodios.length === 0 ? (
                                        <p className="text-slate-500 text-sm italic">Nenhum episódio cadastrado.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {seasonStats.episodios.slice(0, 5).map(ep => (
                                                <div key={ep.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg text-sm">
                                                    <span className="text-slate-300 truncate max-w-[70%]">{ep.titulo}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${ep.status === 'publicado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {ep.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {seasonStats.episodios.length > 5 && (
                                                <p className="text-xs text-center text-slate-500 pt-1">
                                                    + {seasonStats.episodios.length - 5} episódios...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                                    <span className="text-xl">ℹ️</span>
                                    <div>
                                        <p className="text-sm text-blue-200 font-medium">Analytics Avançado</p>
                                        <p className="text-xs text-blue-300/70 mt-1">
                                            Visualizações, retenção e taxas de conclusão detalhadas estarão disponíveis na <strong>Sprint 6 (Analytics)</strong>.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Criar Temporada */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-6">Nova Temporada</h3>
                        <form onSubmit={handleSubmitCreate} className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm text-slate-400 mb-2">Ordem</label>
                                    <input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm text-slate-400 mb-2">Nome da Temporada</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        placeholder="Ex: Fundamentos da IA"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Breve resumo da temporada..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Mantra</label>
                                <input
                                    type="text"
                                    value={formData.mantra}
                                    onChange={(e) => setFormData({ ...formData, mantra: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    placeholder="Ex: O conhecimento é a chave..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Status</label>
                                <div className="flex bg-slate-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'rascunho' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'rascunho' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Rascunho
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'publicado' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'publicado' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Publicado
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                                >
                                    Criar Temporada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Temporada */}
            {showEditModal && selectedSeason && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-6">Editar Temporada</h3>
                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm text-slate-400 mb-2">Ordem</label>
                                    <input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm text-slate-400 mb-2">Nome</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                                <textarea
                                    value={formData.descricao || ''}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Mantra</label>
                                <input
                                    type="text"
                                    value={formData.mantra || ''}
                                    onChange={(e) => setFormData({ ...formData, mantra: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Status</label>
                                <div className="flex bg-slate-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'rascunho' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'rascunho' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Rascunho
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'publicado' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'publicado' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Publicado
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Deletar Temporada */}
            {showDeleteModal && selectedSeason && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🗑️
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Temporada?</h3>
                        <p className="text-slate-400 mb-6">
                            Você está prestes a excluir <strong>{selectedSeason.nome}</strong>.
                            Isso também excluirá todos os episódios associados. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(selectedSeason.id);
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Episodios Tab Component - Sprint 4
function EpisodiosTab({ temporadas, onCreate, onUpdate, onDelete }) {
    const [selectedSeasonId, setSelectedSeasonId] = useState('');
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        ordem: 1,
        status: 'rascunho',
        video_url: '',
        audio_url: '',
        transcricao: ''
    });

    useEffect(() => {
        if (temporadas.length > 0 && !selectedSeasonId) {
            setSelectedSeasonId(temporadas[0].id);
        }
    }, [temporadas]);

    useEffect(() => {
        if (selectedSeasonId) {
            fetchEpisodes();
        }
    }, [selectedSeasonId]);

    const fetchEpisodes = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/temporadas/${selectedSeasonId}`);
            setEpisodes(response.data.episodios || []);
        } catch (error) {
            console.error('Erro ao buscar episódios:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            titulo: '',
            descricao: '',
            ordem: episodes.length + 1,
            status: 'rascunho',
            video_url: '',
            audio_url: '',
            transcricao: ''
        });
        setSelectedEpisode(null);
        setShowModal(true);
    };

    const openEditModal = (ep) => {
        setSelectedEpisode(ep);
        setFormData({
            titulo: ep.titulo,
            descricao: ep.descricao || '',
            ordem: ep.ordem,
            status: ep.status,
            video_url: ep.video_url || '',
            transcricao: ep.transcricao || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            temporada_id: selectedSeasonId
        };

        let success = false;
        if (selectedEpisode) {
            success = await onUpdate({ ...data, id: selectedEpisode.id });
        } else {
            success = await onCreate(data);
        }

        if (success) {
            setShowModal(false);
            fetchEpisodes();
        }
    };

    const handleDelete = async () => {
        if (!selectedEpisode) return;
        const success = await onDelete(selectedEpisode.id);
        if (success) {
            setShowDeleteModal(false);
            fetchEpisodes();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Episódios</h2>
                    <p className="text-slate-400 text-sm">Gerencie o conteúdo do podcast</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedSeasonId}
                        onChange={(e) => setSelectedSeasonId(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                    >
                        {temporadas.map(t => (
                            <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                    </select>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                    >
                        + Novo Episódio
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-2 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : episodes.length === 0 ? (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <span className="text-5xl mb-4 block">🎬</span>
                    <p className="text-slate-400">Nenhum episódio encontrado nesta temporada</p>
                </div>
            ) : (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-800/50">
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 text-center">#</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Título</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Status</th>
                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {episodes.map(ep => (
                                    <tr key={ep.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 text-slate-400 font-mono text-center">{ep.ordem}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200">{ep.titulo}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-md">{ep.descricao || 'Sem descrição'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${ep.status === 'publicado'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                {ep.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(ep)}
                                                    className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedEpisode(ep);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-1 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Create/Edit Episode */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {selectedEpisode ? 'Editar Episódio' : 'Novo Episódio'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm text-slate-400 mb-2">Ordem</label>
                                    <input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="col-span-5">
                                    <label className="block text-sm text-slate-400 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">URL do Vídeo (Embed/MP4)</label>
                                    <input
                                        type="text"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">URL do Áudio (MP3)</label>
                                    <input
                                        type="text"
                                        value={formData.audio_url || ''}
                                        onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        placeholder="https://... (Opcional)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Transcrição / Conteúdo</label>
                                <textarea
                                    value={formData.transcricao}
                                    onChange={(e) => setFormData({ ...formData, transcricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none font-mono text-sm"
                                    rows={5}
                                    placeholder="Texto completo ou resumo..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Status</label>
                                <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'rascunho' })}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'rascunho' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Rascunho
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'publicado' })}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${formData.status === 'publicado' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Publicado
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                                >
                                    {selectedEpisode ? 'Salvar Alterações' : 'Criar Episódio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Delete Episode */}
            {showDeleteModal && selectedEpisode && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🗑️
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Episódio?</h3>
                        <p className="text-slate-400 mb-6">
                            Você está prestes a excluir <strong>{selectedEpisode.titulo}</strong>.
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Provas Tab Component
function ProvasTab() {
    const [provas, setProvas] = useState([]);
    const [temporadas, setTemporadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPerguntaModal, setShowPerguntaModal] = useState(false);
    const [showQuestionsList, setShowQuestionsList] = useState(false); // New state for Questions List View
    const [selectedProva, setSelectedProva] = useState(null);
    const [formData, setFormData] = useState({
        temporada_id: '',
        titulo: '',
        descricao: '',
        tentativas_permitidas: 3,
        nota_minima_aprovacao: 70,
        tempo_limite: null,
        mostrar_respostas: true
    });

    // State for managing questions
    const [perguntas, setPerguntas] = useState([]);
    const [perguntaForm, setPerguntaForm] = useState({
        enunciado: '',
        ordem: 1,
        peso: 1,
        opcoes: [
            { texto: '', correta: true, ordem: 'A' },
            { texto: '', correta: false, ordem: 'B' },
            { texto: '', correta: false, ordem: 'C' },
            { texto: '', correta: false, ordem: 'D' }
        ]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [provasRes, temporadasRes] = await Promise.all([
                api.get('/provas').catch(() => ({ data: [] })),
                api.get('/temporadas').catch(() => ({ data: [] }))
            ]);
            setProvas(provasRes.data || []);
            setTemporadas(temporadasRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerguntas = async (provaId) => {
        try {
            const res = await api.get(`/provas/${provaId}`);
            if (res.data && res.data.perguntas) {
                setPerguntas(res.data.perguntas);
            } else {
                setPerguntas([]);
            }
        } catch (error) {
            console.error('Erro ao buscar perguntas:', error);
            setPerguntas([]);
        }
    };

    const openCreateModal = () => {
        setFormData({
            temporada_id: temporadas.length > 0 ? temporadas[0].id : '',
            titulo: '',
            descricao: '',
            tentativas_permitidas: 3,
            nota_minima_aprovacao: 70,
            tempo_limite: null,
            mostrar_respostas: true
        });
        setSelectedProva(null);
        setShowModal(true);
    };

    const openEditModal = (prova) => {
        setSelectedProva(prova);
        setFormData({
            temporada_id: prova.temporada_id,
            titulo: prova.titulo,
            descricao: prova.descricao || '',
            tentativas_permitidas: prova.tentativas_permitidas,
            nota_minima_aprovacao: prova.nota_minima_aprovacao,
            tempo_limite: prova.tempo_limite,
            mostrar_respostas: prova.mostrar_respostas
        });
        setShowModal(true);
    };

    const openQuestionsManager = async (prova) => {
        setSelectedProva(prova);
        await fetchPerguntas(prova.id);
        setShowQuestionsList(true);
    };

    const openAddQuestionModal = () => {
        setPerguntaForm({
            enunciado: '',
            ordem: perguntas.length + 1,
            peso: 1,
            opcoes: [
                { texto: '', correta: true, ordem: 'A' },
                { texto: '', correta: false, ordem: 'B' },
                { texto: '', correta: false, ordem: 'C' },
                { texto: '', correta: false, ordem: 'D' }
            ]
        });
        setShowPerguntaModal(true);
    };

    const handleSubmitProva = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tempo_limite: formData.tempo_limite || null
            };

            if (selectedProva) {
                await api.put(`/provas/${selectedProva.id}`, payload);
            } else {
                await api.post('/provas', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao salvar prova');
        }
    };

    const handleDeleteProva = async () => {
        if (!selectedProva) return;
        try {
            await api.delete(`/provas/${selectedProva.id}`);
            setShowDeleteModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao excluir prova');
        }
    };

    const handleAddPergunta = async (e) => {
        e.preventDefault();
        if (!selectedProva) return;

        const hasCorrect = perguntaForm.opcoes.some(o => o.correta);
        if (!hasCorrect) {
            alert('Marque uma opção como correta!');
            return;
        }

        try {
            await api.post(`/provas/${selectedProva.id}/perguntas`, perguntaForm);
            setShowPerguntaModal(false);
            fetchPerguntas(selectedProva.id); // Refresh questions list
            fetchData(); // Refresh main list stats if needed
            alert('Pergunta adicionada com sucesso!');
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao adicionar pergunta');
        }
    };

    const handleDeletePergunta = async (perguntaId) => {
        if (!confirm('Excluir esta pergunta?')) return;
        try {
            await api.delete(`/provas/perguntas/${perguntaId}`);
            fetchPerguntas(selectedProva.id);
        } catch (error) {
            console.error('Erro ao deletar pergunta', error);
            alert('Erro ao excluir pergunta. Verifique conexao.');
        }
    };

    const handleOpcaoChange = (index, field, value) => {
        const newOpcoes = [...perguntaForm.opcoes];
        if (field === 'correta' && value) {
            newOpcoes.forEach((o, i) => o.correta = i === index);
        } else {
            newOpcoes[index][field] = value;
        }
        setPerguntaForm({ ...perguntaForm, opcoes: newOpcoes });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Provas</h2>
                    <p className="text-slate-400 text-sm">Gerencie avaliações e certificações</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                >
                    + Nova Prova
                </button>
            </div>

            {provas.length === 0 ? (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <span className="text-5xl mb-4 block">📝</span>
                    <p className="text-slate-400">Nenhuma prova cadastrada</p>
                    <button onClick={openCreateModal} className="text-aec-pink hover:underline mt-2">
                        Criar primeira prova
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {provas.map(prova => (
                        <div key={prova.id} className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 group hover:border-slate-600 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg shadow-indigo-500/20">
                                        🎓
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{prova.titulo}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span>
                                                {temporadas.find(t => t.id === prova.temporada_id)?.nome || 'Temporada desconhecida'}
                                            </span>
                                            <span>•</span>
                                            <span>{prova.total_perguntas || 0} questões</span>
                                        </div>
                                        <div className="flex gap-3 mt-2">
                                            <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                                                Tentativas: {prova.tentativas_permitidas}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${prova.nota_minima_aprovacao >= 70
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                                }`}>
                                                Min: {prova.nota_minima_aprovacao}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openQuestionsManager(prova)}
                                        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors flex items-center gap-2"
                                    >
                                        <span>❓</span> Questões
                                    </button>
                                    <button
                                        onClick={() => openEditModal(prova)}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                                        title="Editar Configurações"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedProva(prova);
                                            setShowDeleteModal(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                                        title="Excluir Prova"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Questions Manager */}
            {showQuestionsList && selectedProva && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-white">Gerenciar Questões</h3>
                                <p className="text-sm text-slate-400">{selectedProva.titulo}</p>
                            </div>
                            <button
                                onClick={() => setShowQuestionsList(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-lg font-semibold text-slate-200">
                                    Total: {perguntas.length} questões
                                </h4>
                                <button
                                    onClick={openAddQuestionModal}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                                >
                                    + Adicionar Questão
                                </button>
                            </div>

                            <div className="space-y-4">
                                {perguntas.map((p, idx) => (
                                    <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex gap-4 flex-1">
                                                <div className="flex flex-col items-center justify-center bg-slate-800 w-12 h-12 rounded-lg border border-slate-700 shrink-0">
                                                    <span className="text-xs text-slate-500">#{p.ordem}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-slate-200 font-medium whitespace-pre-wrap">{p.enunciado}</p>
                                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {p.opcoes?.map((opt) => (
                                                            <div key={opt.id} className={`text-sm p-2 rounded border ${
                                                                // Correct answer logic would need 'correta' field visible from backend
                                                                // Assuming we might not have it in simple list unless we request it
                                                                // For now verify visualization
                                                                'bg-slate-900/50 border-slate-700 text-slate-400'
                                                                }`}>
                                                                <span className="font-bold mr-2">{opt.ordem})</span>
                                                                {opt.texto}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleDeletePergunta(p.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Excluir questão"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {perguntas.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                                        Nenhuma questão cadastrada nesta prova.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create/Edit Prova */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {selectedProva ? 'Editar Prova' : 'Nova Prova'}
                        </h3>
                        <form onSubmit={handleSubmitProva} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Temporada Vinculada *</label>
                                <select
                                    value={formData.temporada_id}
                                    onChange={(e) => setFormData({ ...formData, temporada_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    required
                                    disabled={!!selectedProva} // Disable changing season on edit to simplify logic
                                >
                                    <option value="">Selecione...</option>
                                    {temporadas.map(t => (
                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Título *</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    placeholder="Ex: Avaliação Final"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Instruções / Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Tentativas</label>
                                    <input
                                        type="number"
                                        value={formData.tentativas_permitidas}
                                        onChange={(e) => setFormData({ ...formData, tentativas_permitidas: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Nota Mínima (%)</label>
                                    <input
                                        type="number"
                                        value={formData.nota_minima_aprovacao}
                                        onChange={(e) => setFormData({ ...formData, nota_minima_aprovacao: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        min={0}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Tempo Limite (minutos - opcional)</label>
                                <input
                                    type="number"
                                    value={formData.tempo_limite || ''}
                                    onChange={(e) => setFormData({ ...formData, tempo_limite: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    placeholder="Sem limite"
                                    min={1}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="mostrar_respostas"
                                    checked={formData.mostrar_respostas}
                                    onChange={(e) => setFormData({ ...formData, mostrar_respostas: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-aec-pink focus:ring-aec-pink"
                                />
                                <label htmlFor="mostrar_respostas" className="text-slate-300 select-none cursor-pointer">
                                    Mostrar respostas/feedback após envio
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                                >
                                    {selectedProva ? 'Salvar Alterações' : 'Criar Prova'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Pergunta (Nested inside Questions Manager usually, but keeping global for z-index simplicity) */}
            {showPerguntaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Nova Questão</h3>
                        <p className="text-slate-400 text-sm mb-6">Para: {selectedProva?.titulo}</p>
                        <form onSubmit={handleAddPergunta} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Enunciado *</label>
                                <textarea
                                    value={perguntaForm.enunciado}
                                    onChange={(e) => setPerguntaForm({ ...perguntaForm, enunciado: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Digite a pergunta..."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Ordem</label>
                                    <input
                                        type="number"
                                        value={perguntaForm.ordem}
                                        onChange={(e) => setPerguntaForm({ ...perguntaForm, ordem: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Peso (Pontos)</label>
                                    <input
                                        type="number"
                                        value={perguntaForm.peso}
                                        onChange={(e) => setPerguntaForm({ ...perguntaForm, peso: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                        min={1}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-3">Opções de Resposta *</label>
                                <div className="space-y-3">
                                    {perguntaForm.opcoes.map((opcao, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold border ${opcao.correta
                                                ? 'bg-green-600 text-white border-green-500'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {opcao.ordem}
                                            </div>
                                            <input
                                                type="text"
                                                value={opcao.texto}
                                                onChange={(e) => handleOpcaoChange(index, 'texto', e.target.value)}
                                                placeholder={`Opção ${opcao.ordem}`}
                                                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleOpcaoChange(index, 'correta', true)}
                                                className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${opcao.correta
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                                    }`}
                                            >
                                                {opcao.correta ? 'Resposta Correta' : 'Marcar Correta'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPerguntaModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors font-medium"
                                >
                                    Salvar Questão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Delete Confirmation for Prova */}
            {showDeleteModal && selectedProva && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🗑️
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Prova?</h3>
                        <p className="text-slate-400 mb-6">
                            Você está prestes a excluir <strong>{selectedProva.titulo}</strong>.
                            Isso apagará todas as questões vinculadas. Ação irreversível.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteProva}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Relatorios Tab Component - Sprint 6
function RelatoriosTab() {
    const [activeReport, setActiveReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [periodo, setPeriodo] = useState('30');
    const [exportLoading, setExportLoading] = useState(false);

    // Chart colors
    const COLORS = ['#be185d', '#0032A1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

    const relatorios = [
        { id: 'visao-geral', titulo: 'Visão Geral', descricao: 'KPIs e métricas principais', icon: '📈', endpoint: '/dashboard/stats' },
        { id: 'usuarios-ativos', titulo: 'Usuários Ativos', descricao: 'Top usuários por progresso', icon: '👥', endpoint: '/dashboard/users-progress' },
        { id: 'performance-provas', titulo: 'Performance Provas', descricao: 'Taxa de aprovação por prova', icon: '🎓', endpoint: '/dashboard/provas-performance' },
        { id: 'episodios-populares', titulo: 'Episódios Populares', descricao: 'Ranking de visualizações', icon: '🎧', endpoint: '/dashboard/episodios-ranking' },
        { id: 'crescimento', titulo: 'Crescimento', descricao: 'Novos usuários por período', icon: '📊', endpoint: '/dashboard/novos-usuarios' },
        { id: 'engajamento', titulo: 'Engajamento', descricao: 'Conclusão vs Visualização', icon: '🔥', endpoint: '/dashboard/stats' }
    ];

    const fetchReportData = async (report) => {
        setLoading(true);
        setActiveReport(report);
        try {
            let url = report.endpoint;
            if (report.id === 'crescimento') {
                url = `${report.endpoint}?dias=${periodo}`;
            }
            const res = await api.get(url);
            setReportData(res.data);
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData) return;
        setExportLoading(true);
        try {
            let csvContent = '';
            let filename = `relatorio_${activeReport.id}_${new Date().toISOString().split('T')[0]}.csv`;

            if (activeReport.id === 'visao-geral') {
                csvContent = 'Categoria,Métrica,Valor\n';
                Object.entries(reportData).forEach(([cat, values]) => {
                    Object.entries(values).forEach(([key, val]) => {
                        csvContent += `${cat},${key},${val}\n`;
                    });
                });
            } else if (activeReport.id === 'usuarios-ativos' && reportData.users) {
                csvContent = 'Nome,Email,Episódios Assistidos,Progresso %\n';
                reportData.users.forEach(u => {
                    csvContent += `"${u.nome}","${u.email}",${u.episodios_assistidos},${u.progresso}\n`;
                });
            } else if (activeReport.id === 'performance-provas' && reportData.provas) {
                csvContent = 'Prova,Tentativas,Aprovadas,Taxa Aprovação %,Média Pontuação\n';
                reportData.provas.forEach(p => {
                    csvContent += `"${p.titulo}",${p.total_tentativas},${p.aprovadas},${p.taxa_aprovacao},${p.media_pontuacao}\n`;
                });
            } else if (activeReport.id === 'episodios-populares' && reportData.episodios) {
                csvContent = 'Episódio,Visualizações,Concluídos,Taxa Conclusão %\n';
                reportData.episodios.forEach(e => {
                    csvContent += `"${e.titulo}",${e.visualizacoes},${e.concluidos},${e.taxa_conclusao}\n`;
                });
            } else if (activeReport.id === 'crescimento' && reportData.dados) {
                csvContent = 'Data,Novos Usuários\n';
                reportData.dados.forEach(d => {
                    csvContent += `${d.data},${d.quantidade}\n`;
                });
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            alert('Erro ao exportar CSV');
        } finally {
            setExportLoading(false);
        }
    };

    const closeReport = () => {
        setActiveReport(null);
        setReportData(null);
    };

    // Render report content based on type
    const renderReportContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (!reportData) {
            return (
                <div className="text-center py-16 text-slate-400">
                    Nenhum dado disponível para este relatório.
                </div>
            );
        }

        switch (activeReport.id) {
            case 'visao-geral':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-2xl font-bold text-white">{reportData.usuarios?.total || 0}</div>
                                <div className="text-sm text-slate-400">Total Usuários</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-2xl font-bold text-green-400">{reportData.usuarios?.ativos || 0}</div>
                                <div className="text-sm text-slate-400">Usuários Ativos</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-2xl font-bold text-blue-400">{reportData.episodios?.total || 0}</div>
                                <div className="text-sm text-slate-400">Total Episódios</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-2xl font-bold text-purple-400">{reportData.provas?.total || 0}</div>
                                <div className="text-sm text-slate-400">Total Provas</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-white font-medium mb-4">Distribuição de Usuários</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Ativos', value: reportData.usuarios?.ativos || 0 },
                                                { name: 'Pendentes', value: reportData.usuarios?.pendentes || 0 },
                                                { name: 'Inativos', value: reportData.usuarios?.inativos || 0 }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={70}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {COLORS.slice(0, 3).map((color, index) => (
                                                <Cell key={index} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-white font-medium mb-4">Performance Provas</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Tentativas</span>
                                        <span className="text-white font-bold">{reportData.provas?.tentativas || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Aprovadas</span>
                                        <span className="text-green-400 font-bold">{reportData.provas?.aprovadas || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Taxa de Aprovação</span>
                                        <span className="text-aec-pink font-bold">{reportData.provas?.taxa_aprovacao || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'usuarios-ativos':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-4">Top Usuários por Progresso</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.users?.slice(0, 10) || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                                    <YAxis type="category" dataKey="nome" width={120} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="progresso" fill="#be185d" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="p-3 text-slate-400 text-sm">#</th>
                                        <th className="p-3 text-slate-400 text-sm">Nome</th>
                                        <th className="p-3 text-slate-400 text-sm">Email</th>
                                        <th className="p-3 text-slate-400 text-sm text-right">Episódios</th>
                                        <th className="p-3 text-slate-400 text-sm text-right">Progresso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(reportData.users || []).map((u, idx) => (
                                        <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="p-3 text-slate-500">{idx + 1}</td>
                                            <td className="p-3 text-white">{u.nome}</td>
                                            <td className="p-3 text-slate-400">{u.email}</td>
                                            <td className="p-3 text-right text-slate-300">{u.episodios_assistidos}/{u.total_episodios}</td>
                                            <td className="p-3 text-right">
                                                <span className={`font-bold ${u.progresso >= 80 ? 'text-green-400' : u.progresso >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                    {u.progresso}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'performance-provas':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-4">Taxa de Aprovação por Prova</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.provas || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="titulo" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="taxa_aprovacao" name="Taxa Aprovação %" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="media_pontuacao" name="Média Pontuação" fill="#be185d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(reportData.provas || []).map(p => (
                                <div key={p.prova_id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <h5 className="text-white font-medium truncate">{p.titulo}</h5>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Tentativas</span>
                                            <span className="text-white">{p.total_tentativas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Aprovadas</span>
                                            <span className="text-green-400">{p.aprovadas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Taxa</span>
                                            <span className="text-aec-pink font-bold">{p.taxa_aprovacao}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'episodios-populares':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-4">Ranking de Episódios</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.episodios || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" stroke="#94a3b8" />
                                    <YAxis type="category" dataKey="titulo" width={150} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="visualizacoes" name="Visualizações" fill="#0032A1" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="concluidos" name="Concluídos" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case 'crescimento':
                return (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4">
                            {['7', '30', '90', '365'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => { setPeriodo(d); fetchReportData(activeReport); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${periodo === d
                                        ? 'bg-aec-pink text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {d === '7' ? '7 dias' : d === '30' ? '30 dias' : d === '90' ? '3 meses' : '1 ano'}
                                </button>
                            ))}
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-4">Novos Usuários por Dia</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={reportData.dados || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="data" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="quantidade"
                                        stroke="#be185d"
                                        strokeWidth={2}
                                        dot={{ fill: '#be185d', r: 4 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#be185d', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-white">
                                    {(reportData.dados || []).reduce((sum, d) => sum + d.quantidade, 0)}
                                </div>
                                <div className="text-sm text-slate-400">Total no Período</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {Math.max(...(reportData.dados || [{ quantidade: 0 }]).map(d => d.quantidade))}
                                </div>
                                <div className="text-sm text-slate-400">Pico Diário</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                    {((reportData.dados || []).reduce((sum, d) => sum + d.quantidade, 0) / Math.max((reportData.dados || []).length, 1)).toFixed(1)}
                                </div>
                                <div className="text-sm text-slate-400">Média Diária</div>
                            </div>
                        </div>
                    </div>
                );

            case 'engajamento':
                const totalVisualizacoes = reportData.episodios?.visualizacoes || 0;
                const totalConcluidos = reportData.episodios?.concluidos || 0;
                const taxaEngajamento = totalVisualizacoes > 0 ? ((totalConcluidos / totalVisualizacoes) * 100).toFixed(1) : 0;
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-xl border border-blue-500/30">
                                <div className="text-3xl font-bold text-white">{totalVisualizacoes}</div>
                                <div className="text-sm text-blue-300">Total Visualizações</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 rounded-xl border border-green-500/30">
                                <div className="text-3xl font-bold text-white">{totalConcluidos}</div>
                                <div className="text-sm text-green-300">Total Concluídos</div>
                            </div>
                            <div className="bg-gradient-to-br from-aec-pink/20 to-purple-600/10 p-6 rounded-xl border border-aec-pink/30">
                                <div className="text-3xl font-bold text-white">{taxaEngajamento}%</div>
                                <div className="text-sm text-pink-300">Taxa de Engajamento</div>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-4">Engajamento por Área</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Visualizados', value: totalVisualizacoes - totalConcluidos },
                                            { name: 'Concluídos', value: totalConcluidos }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        <Cell fill="#0032A1" />
                                        <Cell fill="#10b981" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            default:
                return <div className="text-slate-400">Relatório não disponível.</div>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Relatórios</h2>
                    <p className="text-slate-400 text-sm">Analytics e exportação de dados</p>
                </div>
            </div>

            {!activeReport ? (
                // Grid of report cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatorios.map(rel => (
                        <button
                            key={rel.id}
                            onClick={() => fetchReportData(rel)}
                            className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left hover:border-aec-pink/50 hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-aec-pink/20 to-purple-600/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {rel.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{rel.titulo}</h3>
                                    <p className="text-slate-400 text-sm">{rel.descricao}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                // Report detail view
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={closeReport}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{activeReport.icon}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{activeReport.titulo}</h3>
                                    <p className="text-sm text-slate-400">{activeReport.descricao}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={exportToCSV}
                                disabled={exportLoading || !reportData}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center gap-2"
                            >
                                {exportLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span>📥</span>
                                )}
                                CSV
                            </button>
                            <button
                                onClick={() => fetchReportData(activeReport)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                            >
                                🔄 Atualizar
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        {renderReportContent()}
                    </div>
                </div>
            )}
        </div>
    );
}

// Configuracoes Tab Component - Sprint 7
function ConfiguracoesTab() {
    const [activeModule, setActiveModule] = useState(null);
    const [configs, setConfigs] = useState({
        visual: {
            corPrimaria: '#be185d',
            logoUrl: '',
            modoEscuro: true
        },
        email: {
            templateBoasVindas: 'Olá {{nome}}, seja bem-vindo ao Next Level Podcast!',
            templateAprovacao: 'Parabéns {{nome}}! Seu cadastro foi aprovado.',
            templateRecuperacao: 'Clique no link para recuperar sua senha: {{link}}'
        },
        seguranca: {
            minCaractereSenha: 8,
            exigirMaiuscula: true,
            exigirNumero: true,
            sessaoHoras: 24,
            twoFactorEnabled: false
        },
        armazenamento: {
            totalArquivos: 47,
            espacoUsado: '125 MB',
            espacoTotal: '500 MB'
        },
        integracoes: {
            webhookUrl: '',
            googleAnalytics: false,
            s3Enabled: false
        },
        backup: {
            ultimoBackup: '18/01/2026 23:00',
            versaoApp: '1.0.0'
        }
    });
    const [saving, setSaving] = useState(false);

    const modulos = [
        { id: 'visual', titulo: 'Personalização Visual', descricao: 'Logo, cores e tema', icon: '🎨' },
        { id: 'email', titulo: 'Templates de Email', descricao: 'Mensagens automáticas', icon: '📧' },
        { id: 'seguranca', titulo: 'Segurança', descricao: 'Senha e autenticação', icon: '🔐' },
        { id: 'armazenamento', titulo: 'Armazenamento', descricao: 'Arquivos e cache', icon: '💾' },
        { id: 'integracoes', titulo: 'Integrações', descricao: 'APIs e webhooks', icon: '🔗' },
        { id: 'backup', titulo: 'Backup e Manutenção', descricao: 'Exportar dados', icon: '🗄️' }
    ];

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('Configurações salvas com sucesso!');
        }, 1000);
    };

    const exportToCSV = (type) => {
        let csvContent = '';
        let filename = '';

        if (type === 'usuarios') {
            csvContent = 'ID,Nome,Email,Status,Perfil\n1,Admin,admin@test.com,ativo,admin';
            filename = 'usuarios_export.csv';
        } else if (type === 'temporadas') {
            csvContent = 'ID,Nome,Status,Episodios\n1,Temporada Zero,publicado,5';
            filename = 'temporadas_export.csv';
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const renderModuleContent = () => {
        switch (activeModule) {
            case 'visual':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Logo (URL)</label>
                            <input
                                type="text"
                                value={configs.visual.logoUrl}
                                onChange={(e) => setConfigs({ ...configs, visual: { ...configs.visual, logoUrl: e.target.value } })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                placeholder="https://exemplo.com/logo.png"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Cor Primária</label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={configs.visual.corPrimaria}
                                    onChange={(e) => setConfigs({ ...configs, visual: { ...configs.visual, corPrimaria: e.target.value } })}
                                    className="w-16 h-12 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={configs.visual.corPrimaria}
                                    onChange={(e) => setConfigs({ ...configs, visual: { ...configs.visual, corPrimaria: e.target.value } })}
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div>
                                <div className="text-white font-medium">Modo Escuro</div>
                                <div className="text-sm text-slate-400">Tema padrão da aplicação</div>
                            </div>
                            <button
                                onClick={() => setConfigs({ ...configs, visual: { ...configs.visual, modoEscuro: !configs.visual.modoEscuro } })}
                                className={`w-14 h-8 rounded-full transition-colors ${configs.visual.modoEscuro ? 'bg-aec-pink' : 'bg-slate-600'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${configs.visual.modoEscuro ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </button>
                        </div>
                    </div>
                );

            case 'email':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <p className="text-sm text-slate-400 mb-2">Variáveis disponíveis:</p>
                            <div className="flex flex-wrap gap-2">
                                {['{{nome}}', '{{email}}', '{{link}}'].map(v => (
                                    <code key={v} className="px-2 py-1 bg-slate-700 text-aec-pink rounded text-sm">{v}</code>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Template: Boas-vindas</label>
                            <textarea
                                value={configs.email.templateBoasVindas}
                                onChange={(e) => setConfigs({ ...configs, email: { ...configs.email, templateBoasVindas: e.target.value } })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Template: Aprovação de Cadastro</label>
                            <textarea
                                value={configs.email.templateAprovacao}
                                onChange={(e) => setConfigs({ ...configs, email: { ...configs.email, templateAprovacao: e.target.value } })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Template: Recuperação de Senha</label>
                            <textarea
                                value={configs.email.templateRecuperacao}
                                onChange={(e) => setConfigs({ ...configs, email: { ...configs.email, templateRecuperacao: e.target.value } })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                );

            case 'seguranca':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Mínimo de Caracteres</label>
                                <input
                                    type="number"
                                    value={configs.seguranca.minCaractereSenha}
                                    onChange={(e) => setConfigs({ ...configs, seguranca: { ...configs.seguranca, minCaractereSenha: parseInt(e.target.value) } })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    min={6}
                                    max={32}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Sessão (horas)</label>
                                <input
                                    type="number"
                                    value={configs.seguranca.sessaoHoras}
                                    onChange={(e) => setConfigs({ ...configs, seguranca: { ...configs.seguranca, sessaoHoras: parseInt(e.target.value) } })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    min={1}
                                    max={168}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'exigirMaiuscula', label: 'Exigir letra maiúscula' },
                                { key: 'exigirNumero', label: 'Exigir número' },
                                { key: 'twoFactorEnabled', label: 'Autenticação 2FA (em breve)' }
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <span className="text-white">{item.label}</span>
                                    <button
                                        onClick={() => setConfigs({ ...configs, seguranca: { ...configs.seguranca, [item.key]: !configs.seguranca[item.key] } })}
                                        disabled={item.key === 'twoFactorEnabled'}
                                        className={`w-14 h-8 rounded-full transition-colors ${configs.seguranca[item.key] ? 'bg-aec-pink' : 'bg-slate-600'} ${item.key === 'twoFactorEnabled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full transition-transform ${configs.seguranca[item.key] ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'armazenamento':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-white">{configs.armazenamento.totalArquivos}</div>
                                <div className="text-sm text-slate-400">Total Arquivos</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-blue-400">{configs.armazenamento.espacoUsado}</div>
                                <div className="text-sm text-slate-400">Espaço Usado</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-2xl font-bold text-green-400">{configs.armazenamento.espacoTotal}</div>
                                <div className="text-sm text-slate-400">Espaço Total</div>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Uso do armazenamento</span>
                                <span className="text-white font-medium">25%</span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-aec-pink to-purple-500 w-1/4 rounded-full"></div>
                            </div>
                        </div>
                        <button className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700">
                            🗑️ Limpar Cache
                        </button>
                    </div>
                );

            case 'integracoes':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Webhook URL</label>
                            <input
                                type="text"
                                value={configs.integracoes.webhookUrl}
                                onChange={(e) => setConfigs({ ...configs, integracoes: { ...configs.integracoes, webhookUrl: e.target.value } })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                placeholder="https://seu-servidor.com/webhook"
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📈</span>
                                    <div>
                                        <div className="text-white font-medium">Google Analytics</div>
                                        <div className="text-sm text-slate-400">Rastrear visitantes</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfigs({ ...configs, integracoes: { ...configs.integracoes, googleAnalytics: !configs.integracoes.googleAnalytics } })}
                                    className={`w-14 h-8 rounded-full transition-colors ${configs.integracoes.googleAnalytics ? 'bg-aec-pink' : 'bg-slate-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${configs.integracoes.googleAnalytics ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 opacity-60">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">☁️</span>
                                    <div>
                                        <div className="text-white font-medium">Amazon S3</div>
                                        <div className="text-sm text-slate-400">Armazenamento de mídia (em breve)</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">Em breve</span>
                            </div>
                        </div>
                    </div>
                );

            case 'backup':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400">Último Backup</div>
                                <div className="text-lg font-medium text-white">{configs.backup.ultimoBackup}</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400">Versão do App</div>
                                <div className="text-lg font-medium text-aec-pink">{configs.backup.versaoApp}</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-white font-medium">Exportar Dados</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => exportToCSV('usuarios')}
                                    className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    📥 Exportar Usuários
                                </button>
                                <button
                                    onClick={() => exportToCSV('temporadas')}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    📥 Exportar Temporadas
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-white font-medium mb-3">Logs do Sistema</h4>
                            <div className="space-y-2 font-mono text-sm">
                                {[
                                    { time: '07:40:25', msg: 'Deploy Sprint 6 concluído', type: 'success' },
                                    { time: '07:35:12', msg: 'Usuário admin logou', type: 'info' },
                                    { time: '07:30:00', msg: 'Backup automático realizado', type: 'info' }
                                ].map((log, i) => (
                                    <div key={i} className="flex gap-3 text-slate-400">
                                        <span className="text-slate-500">[{log.time}]</span>
                                        <span className={log.type === 'success' ? 'text-green-400' : ''}>{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Configurações</h2>
                    <p className="text-slate-400 text-sm">Personalize a plataforma</p>
                </div>
            </div>

            {!activeModule ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulos.map(mod => (
                        <button
                            key={mod.id}
                            onClick={() => setActiveModule(mod.id)}
                            className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left hover:border-aec-pink/50 hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-aec-pink/20 to-purple-600/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {mod.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{mod.titulo}</h3>
                                    <p className="text-slate-400 text-sm">{mod.descricao}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveModule(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{modulos.find(m => m.id === activeModule)?.icon}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{modulos.find(m => m.id === activeModule)?.titulo}</h3>
                                    <p className="text-sm text-slate-400">{modulos.find(m => m.id === activeModule)?.descricao}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-aec-pink hover:bg-aec-pinkDark disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : '💾'} Salvar
                        </button>
                    </div>
                    <div className="p-6">
                        {renderModuleContent()}
                    </div>
                </div>
            )}
        </div>
    );
}

// Logs Tab Component - Sprint 8
function LogsTab() {
    const [activeLogTab, setActiveLogTab] = useState('atividades');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('7');

    // Mock data for activity logs
    const logsAtividades = [
        { id: 1, tipo: 'login', usuario: 'Fernando Evangelista', acao: 'Login realizado', data: '19/01/2026 09:30:15', ip: '192.168.1.100', status: 'success' },
        { id: 2, tipo: 'create', usuario: 'Fernando Evangelista', acao: 'Prova criada: "Prova Final Sprint 5"', data: '19/01/2026 09:25:42', ip: '192.168.1.100', status: 'success' },
        { id: 3, tipo: 'update', usuario: 'Fernando Evangelista', acao: 'Temporada editada: "Temporada Zero"', data: '19/01/2026 09:20:18', ip: '192.168.1.100', status: 'success' },
        { id: 4, tipo: 'delete', usuario: 'Fernando Evangelista', acao: 'Episódio excluído: "Ep. Teste"', data: '19/01/2026 08:55:33', ip: '192.168.1.100', status: 'warning' },
        { id: 5, tipo: 'login', usuario: 'Admin', acao: 'Login realizado', data: '18/01/2026 23:45:10', ip: '10.0.0.1', status: 'success' },
        { id: 6, tipo: 'create', usuario: 'Admin', acao: 'Usuário aprovado: "Maria Santos"', data: '18/01/2026 22:30:00', ip: '10.0.0.1', status: 'success' },
        { id: 7, tipo: 'update', usuario: 'Admin', acao: 'Configurações alteradas', data: '18/01/2026 21:15:45', ip: '10.0.0.1', status: 'info' },
        { id: 8, tipo: 'export', usuario: 'Fernando Evangelista', acao: 'Relatório exportado: CSV', data: '18/01/2026 20:00:12', ip: '192.168.1.100', status: 'success' },
    ];

    // Mock data for error logs
    const logsErros = [
        { id: 1, tipo: 'api', mensagem: 'Timeout na requisição /dashboard/stats', stack: 'AxiosError: timeout of 30000ms exceeded', data: '19/01/2026 07:45:22', resolvido: true },
        { id: 2, tipo: 'render', mensagem: 'Cannot read property "nome" of undefined', stack: 'TypeError at UserCard.jsx:45', data: '18/01/2026 15:30:10', resolvido: true },
        { id: 3, tipo: 'api', mensagem: '401 Unauthorized - Token expirado', stack: 'AxiosError: Request failed with status 401', data: '18/01/2026 12:20:55', resolvido: true },
        { id: 4, tipo: 'network', mensagem: 'Failed to fetch - Backend offline', stack: 'TypeError: Failed to fetch at api.js:15', data: '17/01/2026 08:00:00', resolvido: false },
    ];

    const tiposAtividade = [
        { value: 'todos', label: 'Todos' },
        { value: 'login', label: 'Login' },
        { value: 'create', label: 'Criação' },
        { value: 'update', label: 'Edição' },
        { value: 'delete', label: 'Exclusão' },
        { value: 'export', label: 'Exportação' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            default: return 'text-blue-400';
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'login': return '🔐';
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            case 'export': return '📥';
            case 'api': return '🌐';
            case 'render': return '🖥️';
            case 'network': return '📡';
            default: return '📋';
        }
    };

    const filteredLogs = logsAtividades.filter(log => {
        if (filtroTipo !== 'todos' && log.tipo !== filtroTipo) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Logs do Sistema</h2>
                    <p className="text-slate-400 text-sm">Monitoramento de atividades e erros</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveLogTab('atividades')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${activeLogTab === 'atividades'
                        ? 'bg-aec-pink text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📋 Atividades
                </button>
                <button
                    onClick={() => setActiveLogTab('erros')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${activeLogTab === 'erros'
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    ⚠️ Erros
                    {logsErros.filter(e => !e.resolvido).length > 0 && (
                        <span className="ml-2 bg-red-600 text-xs px-2 py-0.5 rounded-full">
                            {logsErros.filter(e => !e.resolvido).length}
                        </span>
                    )}
                </button>
            </div>

            {activeLogTab === 'atividades' && (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex flex-wrap gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-aec-pink focus:outline-none"
                            >
                                {tiposAtividade.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Período</label>
                            <select
                                value={filtroPeriodo}
                                onChange={(e) => setFiltroPeriodo(e.target.value)}
                                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-aec-pink focus:outline-none"
                            >
                                <option value="1">Último dia</option>
                                <option value="7">Últimos 7 dias</option>
                                <option value="30">Últimos 30 dias</option>
                                <option value="90">Últimos 3 meses</option>
                            </select>
                        </div>
                        <div className="ml-auto flex items-end">
                            <span className="text-sm text-slate-400">{filteredLogs.length} registros</span>
                        </div>
                    </div>

                    {/* Activity Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-700 bg-slate-800/50">
                                    <th className="p-3 text-slate-400 text-xs font-medium">Tipo</th>
                                    <th className="p-3 text-slate-400 text-xs font-medium">Usuário</th>
                                    <th className="p-3 text-slate-400 text-xs font-medium">Ação</th>
                                    <th className="p-3 text-slate-400 text-xs font-medium">Data/Hora</th>
                                    <th className="p-3 text-slate-400 text-xs font-medium">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3">
                                            <span className="text-xl" title={log.tipo}>{getTipoIcon(log.tipo)}</span>
                                        </td>
                                        <td className="p-3 text-white text-sm">{log.usuario}</td>
                                        <td className="p-3">
                                            <span className={`text-sm ${getStatusColor(log.status)}`}>{log.acao}</span>
                                        </td>
                                        <td className="p-3 text-slate-400 text-sm font-mono">{log.data}</td>
                                        <td className="p-3 text-slate-500 text-xs font-mono">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeLogTab === 'erros' && (
                <div className="space-y-4">
                    {logsErros.map(erro => (
                        <div
                            key={erro.id}
                            className={`bg-slate-900/85 backdrop-blur-xl border rounded-2xl p-4 ${erro.resolvido ? 'border-slate-800' : 'border-red-500/50'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getTipoIcon(erro.tipo)}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${erro.resolvido ? 'text-slate-300' : 'text-red-400'}`}>
                                                {erro.mensagem}
                                            </span>
                                            {erro.resolvido ? (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Resolvido</span>
                                            ) : (
                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Pendente</span>
                                            )}
                                        </div>
                                        <code className="text-xs text-slate-500 mt-1 block font-mono">{erro.stack}</code>
                                        <span className="text-xs text-slate-600 mt-2 block">{erro.data}</span>
                                    </div>
                                </div>
                                {!erro.resolvido && (
                                    <button className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors">
                                        Marcar Resolvido
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{logsAtividades.length}</div>
                    <div className="text-xs text-slate-400">Total Atividades</div>
                </div>
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{logsAtividades.filter(l => l.tipo === 'login').length}</div>
                    <div className="text-xs text-slate-400">Logins</div>
                </div>
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{logsErros.filter(e => !e.resolvido).length}</div>
                    <div className="text-xs text-slate-400">Erros Pendentes</div>
                </div>
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{logsErros.filter(e => e.resolvido).length}</div>
                    <div className="text-xs text-slate-400">Erros Resolvidos</div>
                </div>
            </div>
        </div>
    );
}
