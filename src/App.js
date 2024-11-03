import React, { useState, useEffect } from 'react';
import LoginForm from './login/LoginForm';
import Menu from './login/Menu';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BattlePage from './battle/BattlePage';
import WebSocketService from './WebSocketService';
import {UserProvider} from "./battle/UserContext";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        console.log('Logged in user:', userData);
        setUser(userData);
        setIsLoggedIn(true);

        WebSocketService.connect(userData, () => {
            console.log("WebSocket connection established.");
            WebSocketService.subscribe('/user/queue/startBattle', (message) => {
                console.log("Start battle message received:", message.body);
            });
        });
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        WebSocketService.disconnect();
    };

    useEffect(() => {
        return () => {
            WebSocketService.disconnect();
        };
    }, []);

    return (
        <UserProvider>
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
        </UserProvider>
    )
}


export default App;
