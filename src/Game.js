import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Game() {
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Получаем состояние игры при загрузке компонента
    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/game/3'); // Укажи ID игры
                setGame(response.data);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };
        fetchGame();
    }, []);

    // Логика атаки
    const handleAttack = async (attackerId, cardId) => {
        try {
            const response = await axios.post(`http://localhost:8080/api/game/${game.id}/attack?attackerId=${attackerId}&cardId=${cardId}`);
            setGame(response.data); // Обновляем состояние игры после атаки
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <p>Loading game...</p>;
    if (error) return <p>Error loading game data!</p>;

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Game {game.id}</h1>
            <h2>Status: {game.status}</h2>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px' }}>
                {/* Игрок 1 */}
                <div>
                    <h3>{game.playerOne.name}</h3>
                    <p>Health: {game.playerOne.health}</p>
                    <h4>Cards</h4>
                    <ul>
                        {game.playerOne.cards.map(card => (
                            <li key={card.id}>
                                {card.name} (Power: {card.power})
                                {game.currentTurn === 1 && (
                                    <button onClick={() => handleAttack(game.playerOne.id, card.id)}>Use</button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Игрок 2 */}
                <div>
                    <h3>{game.playerTwo.name}</h3>
                    <p>Health: {game.playerTwo.health}</p>
                    <h4>Cards</h4>
                    <ul>
                        {game.playerTwo.cards.map(card => (
                            <li key={card.id}>
                                {card.name} (Power: {card.power})
                                {game.currentTurn === 2 && (
                                    <button onClick={() => handleAttack(game.playerTwo.id, card.id)}>Use</button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {game.status === 'COMPLETED' && <h2>Game Over</h2>}
        </div>
    );
}

export default Game;
