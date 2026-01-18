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
            setUsers(usersRes.data || []);
            setPendingUsers((usersRes.data || []).filter(u => u.status === 'pendente'));
            setTemporadas(temporadasRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
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
                            <DashboardTab stats={stats} users={users} pendingUsers={pendingUsers} temporadas={temporadas} />
                        )}
                        {activeTab === 'users' && (
                            <UsersTab
                                users={users}
                                pendingUsers={pendingUsers}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onRefresh={fetchData}
                            />
                        )}
                        {activeTab === 'temporadas' && (
                            <TemporadasTab temporadas={temporadas} onRefresh={fetchData} />
                        )}
                        {activeTab === 'provas' && (
                            <ProvasTab />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Dashboard Tab Component with Charts
function DashboardTab({ stats, users, pendingUsers, temporadas }) {
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
                    value="450 MB"
                    icon="☁️"
                    color="yellow"
                    subtitle={
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                    }
                    badge="45% de 1GB"
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

// Users Tab Component
function UsersTab({ users, pendingUsers, onApprove, onReject, onRefresh }) {
    const [filter, setFilter] = useState('all');

    const filteredUsers = users.filter(u => {
        if (filter === 'all') return true;
        return u.status === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Usuários</h2>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    🔄 Atualizar
                </button>
            </div>

            {/* Pending Users */}
            {pendingUsers.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>⏳</span> Aguardando Aprovação ({pendingUsers.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="bg-slate-900/80 rounded-xl p-4 flex items-center justify-between border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                                        {user.nome_completo.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{user.nome_completo}</p>
                                        <p className="text-sm text-slate-400">{user.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                                {user.matricula_aec}
                                            </span>
                                            <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded text-purple-400">
                                                {user.cargo}
                                            </span>
                                            <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-400">
                                                {user.area}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onApprove(user.id)}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                                    >
                                        ✓ Aprovar
                                    </button>
                                    <button
                                        onClick={() => onReject(user.id)}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                                    >
                                        ✕ Recusar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'ativo', 'pendente', 'inativo'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === status
                            ? 'bg-aec-pink text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Users List */}
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Usuário</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden md:table-cell">Matrícula</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden lg:table-cell">Cargo</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden lg:table-cell">Área</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Perfil</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-aec-pink/20 rounded-full flex items-center justify-center text-aec-pink font-bold">
                                            {user.nome_completo.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{user.nome_completo}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-300 hidden md:table-cell">{user.matricula_aec || '-'}</td>
                                <td className="p-4 text-slate-300 hidden lg:table-cell">{user.cargo || '-'}</td>
                                <td className="p-4 text-slate-300 hidden lg:table-cell">{user.area || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'ativo' ? 'bg-green-500/20 text-green-400' :
                                        user.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.perfil === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {user.perfil}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Temporadas Tab Component
function TemporadasTab({ temporadas, onRefresh }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Temporadas</h2>
                <button className="px-4 py-2 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium">
                    + Nova Temporada
                </button>
            </div>

            {temporadas.length === 0 ? (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <span className="text-5xl mb-4 block">📚</span>
                    <p className="text-slate-400">Nenhuma temporada cadastrada</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {temporadas.map(temp => (
                        <div key={temp.id} className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-aec-pink to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                                    {temp.numero}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{temp.titulo}</h3>
                                    <p className="text-sm text-slate-400">{temp.descricao}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
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
    const [showPerguntaModal, setShowPerguntaModal] = useState(false);
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

    const handleCreateProva = async (e) => {
        e.preventDefault();
        try {
            await api.post('/provas', {
                ...formData,
                tempo_limite: formData.tempo_limite || null
            });
            setShowModal(false);
            setFormData({
                temporada_id: '',
                titulo: '',
                descricao: '',
                tentativas_permitidas: 3,
                nota_minima_aprovacao: 70,
                tempo_limite: null,
                mostrar_respostas: true
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao criar prova');
        }
    };

    const handleAddPergunta = async (e) => {
        e.preventDefault();
        if (!selectedProva) return;

        // Garantir que apenas uma opção está marcada como correta
        const hasCorrect = perguntaForm.opcoes.some(o => o.correta);
        if (!hasCorrect) {
            alert('Marque uma opção como correta!');
            return;
        }

        try {
            await api.post(`/provas/${selectedProva.id}/perguntas`, perguntaForm);
            setShowPerguntaModal(false);
            setPerguntaForm({
                enunciado: '',
                ordem: perguntaForm.ordem + 1,
                peso: 1,
                opcoes: [
                    { texto: '', correta: true, ordem: 'A' },
                    { texto: '', correta: false, ordem: 'B' },
                    { texto: '', correta: false, ordem: 'C' },
                    { texto: '', correta: false, ordem: 'D' }
                ]
            });
            fetchData();
            alert('Pergunta adicionada com sucesso!');
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao adicionar pergunta');
        }
    };

    const handleDeleteProva = async (provaId) => {
        if (!confirm('Tem certeza que deseja excluir esta prova?')) return;
        try {
            await api.delete(`/provas/${provaId}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Erro ao excluir prova');
        }
    };

    const handleOpcaoChange = (index, field, value) => {
        const newOpcoes = [...perguntaForm.opcoes];
        if (field === 'correta' && value) {
            // Desmarcar todas as outras
            newOpcoes.forEach((o, i) => {
                o.correta = i === index;
            });
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
                <h2 className="text-2xl font-bold text-white">Provas</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-aec-pink text-white rounded-xl hover:bg-aec-pinkDark transition-colors font-medium"
                >
                    + Nova Prova
                </button>
            </div>

            {provas.length === 0 ? (
                <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <span className="text-5xl mb-4 block">📝</span>
                    <p className="text-slate-400">Nenhuma prova cadastrada</p>
                    <p className="text-sm text-slate-500 mt-2">Crie sua primeira prova clicando no botão acima</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {provas.map(prova => (
                        <div key={prova.id} className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl text-white">
                                        📝
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{prova.titulo}</h3>
                                        <p className="text-sm text-slate-400">{prova.descricao || 'Sem descrição'}</p>
                                        <div className="flex gap-3 mt-2">
                                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                                                {prova.tentativas_permitidas} tentativas
                                            </span>
                                            <span className="text-xs bg-green-500/20 px-2 py-1 rounded text-green-400">
                                                Nota mínima: {prova.nota_minima_aprovacao}%
                                            </span>
                                            {prova.tempo_limite && (
                                                <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">
                                                    ⏱️ {prova.tempo_limite} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedProva(prova);
                                            setShowPerguntaModal(true);
                                        }}
                                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                                    >
                                        + Pergunta
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProva(prova.id)}
                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Criar Prova */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Nova Prova</h3>
                        <form onSubmit={handleCreateProva} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Temporada *</label>
                                <select
                                    value={formData.temporada_id}
                                    onChange={(e) => setFormData({ ...formData, temporada_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {temporadas.map(t => (
                                        <option key={t.id} value={t.id}>{t.titulo}</option>
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
                                    placeholder="Ex: Prova Final - Temporada 1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-aec-pink focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Descrição opcional..."
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
                                <label className="block text-sm text-slate-400 mb-2">Tempo Limite (minutos)</label>
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
                                <label htmlFor="mostrar_respostas" className="text-slate-300">
                                    Mostrar respostas após envio
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
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
                                    Criar Prova
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Pergunta */}
            {showPerguntaModal && selectedProva && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Nova Pergunta</h3>
                        <p className="text-slate-400 text-sm mb-6">Prova: {selectedProva.titulo}</p>
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
                                    <label className="block text-sm text-slate-400 mb-2">Peso</label>
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
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${opcao.correta ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
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
                                                className={`px-4 py-3 rounded-xl transition-colors ${opcao.correta ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {opcao.correta ? '✓ Correta' : 'Marcar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPerguntaModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                                >
                                    Adicionar Pergunta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
