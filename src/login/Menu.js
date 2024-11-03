import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { sendInvite, InviteModal } from '../battle/InviteLogic';
import { useNavigate } from 'react-router-dom';

function Menu({ onLogout, currentUser }) {
    const [players, setPlayers] = useState([]);
    const [isFindingPlayers, setIsFindingPlayers] = useState(false);
    const stompClientRef = useRef(null);
    const [inviterId, setInviterId] = useState(null);
    const [inviterName, setInviterName] = useState(null);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [declineNotificationVisible, setDeclineNotificationVisible] = useState(false);
    const [declineMessage, setDeclineMessage] = useState('');
    const navigate = useNavigate();

    const handleFindPlayers = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8080/users', {
                params: { excludeEmail: currentUser.account.email },
            });
            setPlayers(response.data);
        } catch (error) {
            console.error('Ошибка при получении списка игроков:', error);
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
            await axios.post('/auth/logout', {
                email: currentUser.account.email,
            });
            onLogout();
        } catch (error) {
            console.error('Ошибка при выходе из системы:', error);
        }
    };

    const navigateToBattle = useCallback((battleId, opponentName) => {
        navigate(`/battle/${battleId}`, { state: { opponentName } });
    }, [navigate]);

    const handleUserStatusUpdate = useCallback((message) => {
        const updatedUser = JSON.parse(message.body);
        setPlayers((prevPlayers) =>
            prevPlayers.map((player) =>
                player.id === updatedUser.id ? updatedUser : player
            )
        );
    }, []);

    const handleInviteMessage = useCallback((message) => {
        const invite = JSON.parse(message.body);
        if (invite.inviteeId === currentUser.id) {
            setInviterName(invite.inviterName);
            setInviterId(invite.inviterId);
            setInviteModalVisible(true);
        }
    }, [currentUser.id]);

    const handleStartBattle = useCallback((message) => {
        const battleInfo = JSON.parse(message.body);
        const battleId = battleInfo.battleId;
        const opponentName = battleInfo.opponentName;
        navigateToBattle(battleId, opponentName);
    }, [navigateToBattle]);

    const handleDeclineNotification = useCallback((message) => {
        const declineNotification = JSON.parse(message.body);
        setDeclineMessage(declineNotification.message);
        setDeclineNotificationVisible(true);
    }, []);

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
                    email: currentUser.account.email,
                },
            });

            stompClient.onConnect = () => {
                console.log('Подключено к WebSocket');

                stompClient.subscribe('/topic/userStatus', handleUserStatusUpdate);
                stompClient.subscribe('/user/queue/invite', handleInviteMessage);
                stompClient.subscribe('/user/queue/startBattle', handleStartBattle);
                stompClient.subscribe('/user/queue/declineNotification', handleDeclineNotification);
            };

            stompClient.activate();
            stompClientRef.current = stompClient;

            return () => {
                // stompClient.deactivate(); // TODO НА ТЕСТЫ
            };
        }
    }, [
        currentUser,
        handleUserStatusUpdate,
        handleInviteMessage,
        handleStartBattle,
        handleDeclineNotification,
    ]);

    const handleAcceptInvite = async () => {
        setInviteModalVisible(false);
        try {
            await axios.post('http://localhost:8080/invites/accept', {
                inviterId: inviterId,
                inviteeId: currentUser.id,
            });
            console.log('Приглашение принято');
        } catch (error) {
            console.error('Ошибка при принятии приглашения:', error);
        }
    };

    const handleDeclineInvite = async () => {
        setInviteModalVisible(false);
        try {
            await axios.post('http://localhost:8080/invites/decline', {
                inviterId: inviterId,
                inviteeId: currentUser.id,
            });
            console.log('Приглашение отклонено');
        } catch (error) {
            console.error('Ошибка при отклонении приглашения:', error);
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
            {}
            {inviteModalVisible && (
                <InviteModal
                    inviter={inviterName}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                />
            )}

            {!isFindingPlayers ? (
                <>
                    <h2>Меню игры</h2>
                    <button onClick={() => setIsFindingPlayers(true)}>Поиск игроков</button>
                    <button onClick={handleLogout}>Выйти</button>
                </>
            ) : (
                <>
                    <h2>Доступные игроки</h2>
                    <ul>
                        {players.length > 0 ? (
                            players.map((player) => (
                                <li key={player.id}>
                                    {player.username} - {player.onlineStatus ? 'Онлайн' : 'Оффлайн'}
                                    {player.onlineStatus && (
                                        <button onClick={() => sendInvite(currentUser, player)}>
                                            Пригласить в бой
                                        </button>
                                    )}
                                </li>
                            ))
                        ) : (
                            <p>Нет доступных игроков</p>
                        )}
                    </ul>
                    <button onClick={handleBackToMenu}>Назад в меню</button>
                </>
            )}
        </div>
    );
}

export default Menu;
