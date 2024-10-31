import React, { useState } from 'react';
import LoginForm from './login/LoginForm'; // Подключаем форму входа
import Menu from './login/Menu'; // Подключаем меню
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BattlePage from './battle/BattlePage';


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Для управления авторизацией
    const [user, setUser] = useState(null); // Для хранения данных о пользователе

    const handleLogin = (userData) => {
        console.log('Logged in user:', userData);
        setUser(userData); // Сохраняем объект пользователя
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false); // Пользователь выходит
        setUser(null); // Очищаем данные пользователя
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    {!isLoggedIn ? (
                        <Route path="/" element={<LoginForm onLogin={handleLogin} />} />
                    ) : (
                        <>
                            <Route path="/" element={<Menu onLogout={handleLogout} currentUser={user} />} />
                            <Route path="/battle/:battleId" element={<BattlePage currentUser={user} />} />
                        </>
                    )}
                </Routes>
            </div>
        </Router>
    );


}

export default App;
