import React, { useContext, useState } from 'react';
import { UserContext } from '../battle/UserContext';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
    const { login } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            setErrorMessage('Неверный email или пароль');
        }
    };

    return (
        <div className="login-form">
            <h2>Вход</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    required
                />
                <button type="submit">Войти</button>
            </form>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
}

export default LoginForm;
