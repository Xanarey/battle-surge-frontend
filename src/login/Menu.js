import React, { useState } from 'react';
import axios from 'axios';

function Menu({ onLogout, currentUser }) {
    const [players, setPlayers] = useState([]);
    const [isFindingPlayers, setIsFindingPlayers] = useState(false);

    const handleFindPlayers = async () => {
        setIsFindingPlayers(true);

        console.log('Current user in Menu:', currentUser);
        console.log('Current user ID:', currentUser.id);

        try {
            const response = await axios.get(`http://localhost:8080/game/usersListFight?currentEmail=${currentUser}`);
            console.log('Fetched players:', response.data);
            setPlayers(response.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const handleBackToMenu = () => {
        setIsFindingPlayers(false);
    };

    return (
        <div className="menu">
            {!isFindingPlayers ? (
                <>
                    <h2>Game Menu</h2>
                    <button onClick={handleFindPlayers}>Find Players</button>
                    <button onClick={onLogout}>Logout</button>
                </>
            ) : (
                <>
                    <h2>Available Players</h2>
                    <ul>
                        {players.length > 0 ? (
                            players.map((player) => (
                                <li key={player.id}>{player.username}</li>
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
