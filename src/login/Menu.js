import React, {useEffect, useState, useCallback, useRef} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

function Menu({ onLogout, currentUser }) {
    const [players, setPlayers] = useState([]);
    const [isFindingPlayers, setIsFindingPlayers] = useState(false);
    const stompClientRef = useRef(null);

    const handleFindPlayers = useCallback(async () => {
        console.log('Current user in Menu:', currentUser);
        console.log('Current user ID:', currentUser.id);

        try {
            const response = await axios.get(`http://localhost:8080/game/usersListFight?currentEmail=${currentUser.account.email}`);
            console.log('Fetched players:', response.data);
            setPlayers(response.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        if (isFindingPlayers) {
            handleFindPlayers();
        }
    }, [isFindingPlayers, handleFindPlayers]);

    const handleBackToMenu = () => {
        setIsFindingPlayers(false);
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8080/auth/logout', {
                email: currentUser.account.email
            }, {
                withCredentials: true
            });
            onLogout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    useEffect(() => {
        const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
        });

        stompClient.onConnect = () => {
            console.log('Connected to WebSocket');

            // Подписываемся на статус игроков, когда WebSocket подключён
            stompClient.subscribe('/topic/userStatus', (message) => {
                console.log('Received message:', message.body);
                const updatedUser = JSON.parse(message.body);

                setPlayers((prevPlayers) => {
                    return prevPlayers.map((player) =>
                        player.id === updatedUser.id ? updatedUser : player
                    );
                });
            });
        };

        stompClient.activate();
        stompClientRef.current = stompClient;  // Сохраняем stompClient в ref

        return () => {
            stompClient.deactivate();
        };
    }, []);  // WebSocket инициализируется один раз

    useEffect(() => {
        if (currentUser && currentUser.account.email && stompClientRef.current) {
            console.log(`Updating WebSocket headers with email: ${currentUser.account.email}`);
            stompClientRef.current.connectHeaders = {
                email: currentUser.account.email  // Обновляем email после инициализации
            };
        }
    }, [currentUser]);  // Обновляем headers, если currentUser изменится




    return (
        <div className="menu">
            {!isFindingPlayers ? (
                <>
                    <h2>Game Menu</h2>
                    <button onClick={() => setIsFindingPlayers(true)}>Find Players</button>
                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <h2>Available Players</h2>
                    <ul>
                        {players.length > 0 ? (
                            players.map((player) => (
                                <li key={player.id}>
                                    {player.username} - {player.onlineStatus ? 'Online' : 'Offline'}
                                </li>
                            ))
                        ) : (
                            <p>No players available</p>
                        )}
                    </ul>
                    <button onClick={handleBackToMenu}>Back to Menu</button>
                </>
            )}
        </div>
    );
}

export default Menu;
