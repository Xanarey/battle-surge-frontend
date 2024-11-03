import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import WebSocketService from '../WebSocketService';
import { UserContext } from './UserContext';

function BattlePage() {
    const { currentUser } = useContext(UserContext);
    const { battleId } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [playerOneCards, setPlayerOneCards] = useState([]);
    const [playerTwoCards, setPlayerTwoCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCardId, setSelectedCardId] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchGame = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/games/${battleId}`);
                setGame(response.data.game);
                setPlayerOneCards(response.data.playerOneCards || []);
                setPlayerTwoCards(response.data.playerTwoCards || []);
            } catch (err) {
                console.error('Ошибка при загрузке данных игры:', err);
                setError('Ошибка при загрузке данных игры. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };

        fetchGame();

        const topic = `/topic/game-progress/${battleId}`;
        WebSocketService.subscribe(topic, (message) => {
            const updatedGameState = JSON.parse(message.body);
            setGame(updatedGameState.game);
            setPlayerOneCards(updatedGameState.playerOneCards || []);
            setPlayerTwoCards(updatedGameState.playerTwoCards || []);
            setSelectedCardId(null);
        });

        return () => {
            WebSocketService.unsubscribe(topic);
        };
    }, [battleId, currentUser, navigate]);

    const handleAttack = async (defenderCardId) => {
        if (!selectedCardId) {
            setError('Сначала выберите вашу карту для атаки.');
            return;
        }

        try {
            await axios.post(`http://localhost:8080/games/${battleId}/attack`, {
                attackerCardId: selectedCardId,
                defenderCardId,
            });
        } catch (err) {
            console.error('Ошибка при выполнении атаки:', err);
            setError('Ошибка при выполнении атаки. Пожалуйста, попробуйте позже.');
        }
    };

    const selectCardForAttack = (cardId) => {
        setSelectedCardId(cardId);
    };

    if (loading) return <p>Загрузка игры...</p>;
    if (error) return <p>{error}</p>;
    if (!game || !game.playerOne || !game.playerTwo) return <p>Данные игры недоступны.</p>;

    const displayedOpponentName =
        currentUser.id === game.playerOne.id ? game.playerTwo.username : game.playerOne.username;

    const isCurrentTurn =
        (game.currentTurn === 1 && currentUser.id === game.playerOne.id) ||
        (game.currentTurn === 2 && currentUser.id === game.playerTwo.id);

    const renderPlayer = (playerName, playerCards, isPlayer) => (
        <div>
            <h3>{playerName}</h3>
            <h4>Карты</h4>
            <ul>
                {playerCards.length > 0 ? (
                    playerCards.map((card) => (
                        <li key={card.id}>
                            Здоровье: {card.health}, Атака: {card.attack}, Мана: {card.mana}
                            {isPlayer && isCurrentTurn && (
                                <button onClick={() => selectCardForAttack(card.id)}>
                                    {selectedCardId === card.id ? 'Выбрана для атаки' : 'Выбрать'}
                                </button>
                            )}
                            {!isPlayer && selectedCardId && isCurrentTurn && (
                                <button onClick={() => handleAttack(card.id)}>Атаковать</button>
                            )}
                        </li>
                    ))
                ) : (
                    <p>Нет доступных карт</p>
                )}
            </ul>
        </div>
    );

    return (
        <div className="battle-page" style={{ textAlign: 'center' }}>
            <h2>Идентификатор битвы: {battleId}</h2>
            <p>Вы сражаетесь против {displayedOpponentName}</p>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px' }}>
                {renderPlayer(
                    game.playerOne.username,
                    playerOneCards,
                    currentUser.id === game.playerOne.id
                )}
                {renderPlayer(
                    game.playerTwo.username,
                    playerTwoCards,
                    currentUser.id === game.playerTwo.id
                )}
            </div>

            {game.status === 'COMPLETED' && <h2>Игра окончена</h2>}
        </div>
    );
}

export default BattlePage;
