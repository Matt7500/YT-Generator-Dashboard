import React, { useState } from 'react';
import '../css/Modal.css';

const YouTubeChannelSelect = ({ channels, onClose, onSave }) => {
    const [selectedChannels, setSelectedChannels] = useState([]);

    const handleChannelToggle = (channelId) => {
        setSelectedChannels(prev => {
            if (prev.includes(channelId)) {
                return prev.filter(id => id !== channelId);
            }
            return [...prev, channelId];
        });
    };

    const handleSave = () => {
        onSave(selectedChannels);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Select YouTube Channels</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Select the channels you want to manage with YT Generator:</p>
                    <div className="channels-list">
                        {channels.map(channel => (
                            <div key={channel.id} className="channel-list-item">
                                <input
                                    type="checkbox"
                                    id={channel.id}
                                    checked={selectedChannels.includes(channel.id)}
                                    onChange={() => handleChannelToggle(channel.id)}
                                />
                                <img 
                                    src={channel.thumbnailUrl} 
                                    alt={channel.title} 
                                    className="channel-list-avatar"
                                />
                                <label htmlFor={channel.id}>
                                    <strong>{channel.title}</strong>
                                    <div>{channel.description}</div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="add-channel-btn" 
                        onClick={handleSave}
                        disabled={selectedChannels.length === 0}
                    >
                        Import Selected Channels
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YouTubeChannelSelect; 