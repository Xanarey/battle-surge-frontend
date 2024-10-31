import axios from 'axios';
import React from 'react';



export const handleInvite = async (currentUser, player) => {
    // console.log("CHECK currentUser :::: " + currentUser.id)
    // console.log("CHECK player :::: " + player.id)
    try {
        await axios.post(`http://localhost:8080/game/invite`, {
            inviterId: currentUser.id,
            inviteeId: player.id,
        });
        console.log(`Invite sent to ${player.username}`);
    } catch (error) {
        console.error('Error sending invite:', error);
    }
};

export const InviteModal = ({ inviter, onAccept, onDecline }) => (
    <div className="invite-modal">
        <p>{inviter} приглашает вас на бой!</p>
        <button onClick={onAccept}>Принять</button>
        <button onClick={onDecline}>Отклонить</button>

    </div>
);
