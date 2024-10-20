import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const BattleLogic = ({ playerOneName, playerTwoName }) => {
    const [playerOneCards, setPlayerOneCards] = useState([]);
    const [playerTwoCards, setPlayerTwoCards] = useState([]);
    const [currentTurnName, setCurrentTurnName] = useState('');
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [highlightedEnemyCardId, setHighlightedEnemyCardId] = useState(null);

    const playerOneImages = [
        '/images/Ice Blast.png',
        '/images/Earthquake.png',
        '/images/Fireball.png'
    ];

    const playerTwoImages = [
        '/images/Thunder Strike.png',
        '/images/234.png',
        '/images/123.png'
    ];

    useEffect(() => {
        // Получаем карты игроков
        axios.get('http://localhost:8080/game/cards/1')
            .then(response => setPlayerOneCards(response.data))
            .catch(error => console.error('Error fetching Player 1 cards:', error));

        axios.get('http://localhost:8080/game/cards/2')
            .then(response => setPlayerTwoCards(response.data))
            .catch(error => console.error('Error fetching Player 2 cards:', error));

        // Устанавливаем, кто начнёт первым
        const randomStart = Math.random() < 0.5;
        setCurrentTurnName(randomStart ? playerOneName : playerTwoName);
    }, [playerOneName, playerTwoName]);

    const handleCardClick = (cardId, playerName) => {
        if (playerName === currentTurnName) {
            setSelectedCardId(cardId);
        }
    };

    const handleEnemyCardClick = (enemyCardId, enemyPlayerName) => {
        if (selectedCardId && enemyPlayerName !== currentTurnName) {
            const attackerCard = currentTurnName === playerOneName
                ? playerOneCards.find(card => card.id === selectedCardId)
                : playerTwoCards.find(card => card.id === selectedCardId);

            const defenderCard = currentTurnName === playerOneName
                ? playerTwoCards.find(card => card.id === enemyCardId)
                : playerOneCards.find(card => card.id === enemyCardId);

            const newHealth = defenderCard.health - attackerCard.attack;

            if (currentTurnName === playerOneName) {
                setPlayerTwoCards(prevCards =>
                    prevCards
                        .map(card => card.id === enemyCardId ? { ...card, health: newHealth } : card)
                        .filter(card => card.health > 0)
                );
            } else {
                setPlayerOneCards(prevCards =>
                    prevCards
                        .map(card => card.id === enemyCardId ? { ...card, health: newHealth } : card)
                        .filter(card => card.health > 0)
                );
            }

            // Подсвечиваем карту на секунду, затем переключаем ход
            setHighlightedEnemyCardId(enemyCardId);
            setTimeout(() => {
                setHighlightedEnemyCardId(null);
                setSelectedCardId(null);
                const nextPlayer = currentTurnName === playerOneName ? playerTwoName : playerOneName;
                setCurrentTurnName(nextPlayer);
            }, 1000);
        }
    };

    return (
        <div className="battle">
            {/* Карты первого игрока */}
            <div className="player-one-cards">
                {playerOneCards.map((card, index) => (
                    <div
                        className={`card ${selectedCardId === card.id ? 'selected' : ''} ${highlightedEnemyCardId === card.id ? 'attacked' : ''}`}
                        key={card.id}
                        onClick={() => {
                            if (currentTurnName === playerOneName) {
                                handleCardClick(card.id, playerOneName);
                            } else {
                                handleEnemyCardClick(card.id, playerOneName);
                            }
                        }}
                    >
                        <img src={playerOneImages[index]} alt={`Card ${card.id}`} className="card-image" />
                        <div className="card-info">
                            <p>Health: {card.health}</p>
                            <p>Attack: {card.attack}</p>
                            <p>Mana: {card.mana}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Карты второго игрока */}
            <div className="player-two-cards">
                {playerTwoCards.map((card, index) => (
                    <div
                        className={`card ${selectedCardId === card.id ? 'selected' : ''} ${highlightedEnemyCardId === card.id ? 'attacked' : ''}`}
                        key={card.id}
                        onClick={() => {
                            if (currentTurnName === playerTwoName) {
                                handleCardClick(card.id, playerTwoName);
                            } else {
                                handleEnemyCardClick(card.id, playerTwoName);
                            }
                        }}
                    >
                        <img src={playerTwoImages[index]} alt={`Card ${card.id}`} className="card-image" />
                        <div className="card-info">
                            <p>Health: {card.health}</p>
                            <p>Attack: {card.attack}</p>
                            <p>Mana: {card.mana}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
