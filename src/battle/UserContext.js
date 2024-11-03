// context/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import WebSocketService from '../WebSocketService';

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await axios.get('http://localhost:8080/api/user');
                    setCurrentUser(response.data);
                } catch (error) {
                    console.error('Ошибка при восстановлении сессии:', error);
                    localStorage.removeItem('authToken');
                }
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (currentUser) {
            WebSocketService.connect({
                userId: currentUser.id.toString(),
                email: currentUser.account.email,
            });

            console.log('WebSocket подключен для пользователя:', currentUser.email);

            return () => {
                WebSocketService.disconnect();
                console.log('WebSocket отключен');
            };
        }
    }, [currentUser]);


    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:8080/auth/login', { email, password });
            const userData = response.data;
            setCurrentUser(userData);
            localStorage.setItem('authToken', userData.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        } catch (error) {
            console.error('Ошибка при входе:', error);
            throw error;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        WebSocketService.disconnect();
    };

    return (
        <UserContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}
