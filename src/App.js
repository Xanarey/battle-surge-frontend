import React, { useState } from 'react';
import LoginForm from './login/LoginForm'; // Подключаем форму входа
import Menu from './login/Menu'; // Подключаем меню
import { BattleLogic } from './battle/BattleLogic';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Для управления авторизацией
    const [user, setUser] = useState(null); // Для хранения данных о пользователе
    const [isBattleStarted, setIsBattleStarted] = useState(false); // Для управления началом боя

    const handleLogin = (userData) => {
        console.log('Logged in user:', userData);
        setUser(userData);
        setIsLoggedIn(true);
    };


    const handleFindPlayers = () => {
        setIsBattleStarted(true); // Начинаем бой
    };

    const handleLogout = () => {
        setIsLoggedIn(false); // Пользователь выходит
        setIsBattleStarted(false); // Сбрасываем флаг начала боя
        setUser(null); // Очищаем данные пользователя
    };

    return (
        <div className="App">
            {!isLoggedIn ? (
                // Показываем форму входа, если пользователь не залогинен
                <LoginForm onLogin={handleLogin} />
            ) : isBattleStarted ? (
                // Показываем логику боя, если начат бой
                <BattleLogic playerOneName={user.email} />
            ) : (
                // Показываем меню, если пользователь залогинен, но бой не начат
                <Menu onFindPlayers={handleFindPlayers} onLogout={handleLogout} currentUser={user} />

            )}
        </div>
    );
}

export default App;
