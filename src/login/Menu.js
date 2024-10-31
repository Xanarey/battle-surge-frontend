import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { handleInvite } from '../battle/InviteLogic';
import { InviteModal } from '../battle/InviteLogic';  // Импортируем InviteModal
import { useNavigate } from 'react-router-dom';


function Menu({ onLogout, currentUser }) {
    const [players, setPlayers] = useState([]);
    const [isFindingPlayers, setIsFindingPlayers] = useState(false);
    const stompClientRef = useRef(null);
    const [inviterId, setInviterId] = useState(null);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);  // Состояние для показа модального окна
    const [inviter, setInviter] = useState(null);  // Кто отправил приглашение
    const navigate = useNavigate();
    const [declineNotificationVisible, setDeclineNotificationVisible] = useState(false);
    const [declineMessage, setDeclineMessage] = useState('');



    // Запрос списка игроков
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

    const navigateToBattle = useCallback((battleId, opponentName) => {
        navigate(`/battle/${battleId}`, { state: { opponentName } });
    }, [navigate]);

    // Подключение к WebSocket и подписка на события
    useEffect(() => {
        if (currentUser && currentUser.id) {
            const stompClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                reconnectDelay: 5000,
                debug: (str) => {
                    console.log('STOMP: ' + str);
                },
                connectHeaders: {
                    userId: currentUser.id.toString(),
                    email: currentUser.account.email
                },
            });

            stompClient.onConnect = () => {
                console.log('Connected to WebSocket');

                // Подписываемся на канал с обновлениями статуса пользователей
                stompClient.subscribe('/topic/userStatus', (message) => {
                    console.log('Received message:', message.body);
                    const updatedUser = JSON.parse(message.body);

                    setPlayers((prevPlayers) => {
                        return prevPlayers.map((player) =>
                            player.id === updatedUser.id ? updatedUser : player
                        );
                    });
                });

                // Подписываемся на канал для приглашений
                stompClient.subscribe('/topic/invite', (message) => {
                    console.log('Received invite message:', message.body);
                    const invite = JSON.parse(message.body);
                    if (invite.inviteeId === currentUser.id) {
                        setInviter(invite.inviterName);
                        setInviterId(invite.inviterId); // Сохраняем inviterId
                        setInviteModalVisible(true);
                    }
                });

                // Подписка на личные сообщения для приглашений
                stompClient.subscribe('/user/queue/invite', (message) => {
                    const invite = JSON.parse(message.body);
                    setInviter(invite.inviterName);
                    setInviterId(invite.inviterId);
                    setInviteModalVisible(true);
                });

                // Подписка на старт битвы
                stompClient.subscribe('/user/queue/startBattle', (message) => {
                    const battleInfo = JSON.parse(message.body);
                    const battleId = battleInfo.battleId;
                    const opponentName = battleInfo.opponentName;

                    // Перенаправляем на страницу битвы с battleId
                    navigateToBattle(battleId, opponentName);
                });

                // Подписка на уведомления об отказе
                stompClient.subscribe('/user/queue/declineNotification', (message) => {
                    console.log("Received decline notification message:", message);
                    const declineNotification = JSON.parse(message.body);
                    console.log("Parsed decline notification:", declineNotification);
                    setDeclineMessage(declineNotification.message);
                    setDeclineNotificationVisible(true);
                });



            };

            stompClient.activate();
            stompClientRef.current = stompClient;

            return () => {
                stompClient.deactivate();
            };
        }
    }, [currentUser, navigateToBattle]);


    // Обработчики для принятия и отклонения приглашения
    const handleAcceptInvite = async () => {
        console.log('Invitation accepted!');
        setInviteModalVisible(false);

        try {
            await axios.post('http://localhost:8080/game/acceptInvite', {
                inviterId: inviterId,
                inviteeId: currentUser.id,
            });

        } catch (error) {
            console.error('Error accepting invite:', error);
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.id) {
            const stompClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                reconnectDelay: 5000,
                connectHeaders: {
                    userId: currentUser.id.toString(),
                },
            });

            stompClient.onConnect = () => {
                console.log('Connected to WebSocket');

                stompClient.subscribe('/user/queue/startBattle', (message) => {
                    const battleInfo = JSON.parse(message.body);
                    const battleId = battleInfo.battleId;
                    const opponentName = battleInfo.opponentName;

                    navigate(`/battle/${battleId}`, { state: { opponentName } });
                });
            };

            stompClient.activate();
            stompClientRef.current = stompClient;

            return () => {
                stompClient.deactivate();
            };
        }
    }, [currentUser, navigate]);

    const handleDeclineInvite = async () => {
        console.log('Invitation declined!');
        setInviteModalVisible(false);  // Закрываем модальное окно

        try {
            // Отправляем на сервер информацию об отказе от приглашения
            await axios.post('http://localhost:8080/game/declineInvite', {
                inviterId: inviterId,
                inviteeId: currentUser.id
            });

            console.log('Decline request sent successfully');
        } catch (error) {
            console.error('Error declining invite:', error);
        }
    };




    return (
        <div className="menu">
            {declineNotificationVisible && (
                <div className="decline-notification-modal">
                    <p>{declineMessage}</p>
                    <button onClick={() => setDeclineNotificationVisible(false)}>OK</button>
                </div>
            )}
            {/* Модальное окно приглашения */}
            {inviteModalVisible && (
                <InviteModal
                    inviter={inviter}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                />
            )}

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
                                    {player.onlineStatus && (
                                        <button onClick={() => handleInvite(currentUser, player)}>
                                            Invite to Battle
                                        </button>
                                    )}
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
