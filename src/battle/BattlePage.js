import React from 'react';
import { useParams, useLocation } from 'react-router-dom';


function BattlePage({ currentUser }) {
    const { battleId } = useParams();
    const location = useLocation();
    const opponentName = location.state?.opponentName;

    return (
        <div className="battle-page">
            <h2>Battle ID: {battleId}</h2>
            <p>You are battling against {opponentName}</p>
            {/* Здесь будет логика боя */}
        </div>
    );
}

export default BattlePage;
