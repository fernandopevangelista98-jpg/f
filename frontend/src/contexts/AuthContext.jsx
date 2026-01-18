import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('@App:token');
        const storedUser = localStorage.getItem('@App:user');

        if (token && storedUser) {
            api.defaults.headers.Authorization = `Bearer ${token}`;
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                senha: password
            });
            const { access_token, user: userData } = response.data;

            localStorage.setItem('@App:token', access_token);
            localStorage.setItem('@App:user', JSON.stringify(userData));

            api.defaults.headers.Authorization = `Bearer ${access_token}`;
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.detail || 'Erro ao fazer login'
            };
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/auth/register', userData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.detail || 'Erro ao cadastrar'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('@App:token');
        localStorage.removeItem('@App:user');
        api.defaults.headers.Authorization = null;
        setUser(null);
    };

    const isAdmin = () => {
        return user?.perfil === 'admin';
    };

    return (
        <AuthContext.Provider value={{
            signed: !!user,
            user,
            loading,
            login,
            register,
            logout,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
