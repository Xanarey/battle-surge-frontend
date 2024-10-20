import React, { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

function Menu({ onLogout, currentUser }) {
    const [players, setPlayers] = useState([]);
    const [isFindingPlayers, setIsFindingPlayers] = useState(false);

    const handleFindPlayers = useCallback(async () => {
        console.log('Current user in Menu:', currentUser);
        console.log('Current user ID:', currentUser.id);

        try {
            const response = await axios.get(`http://localhost:8080/game/usersListFight?currentEmail=${currentUser.email}`);
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
        console.log(currentUser);
        console.log(currentUser.email);
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
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
        });

        stompClient.onConnect = () => {
            console.log('Connected to WebSocket');
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

        return () => {
            stompClient.deactivate();
        };
    }, []);


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
