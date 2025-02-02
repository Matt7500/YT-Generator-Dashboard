import React, { useState } from 'react';
import { FaPen, FaRobot, FaArrowRight, FaTimes } from 'react-icons/fa';
import '../css/NewStoryModal.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import supabase from '../utils/supabase';

export default function NewStoryModal({ isOpen, onClose, channelId }) {
    const navigate = useNavigate();
    const [isClosing, setIsClosing] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setSelectedOption(null);
            setIsClosing(false);
        }, 300);
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (!selectedOption) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No authenticated user');

            if (selectedOption === 'manual') {
                // Create an empty story for manual writing
                const { data: newStory, error } = await supabase
                    .from('stories')
                    .insert([{
                        title: 'Untitled Story',
                        user_id: session.user.id,
                        channel_id: channelId,
                        status: 'draft',
                        is_manual: true
                    }])
                    .select()
                    .single();

                if (error) throw error;

                handleClose();
                navigate(`/story-writer/${newStory.id}`);
            } else {
                // Navigate to the automated story creation flow
                handleClose();
                navigate('/create-automated-story', { 
                    state: { channelId } 
                });
            }
        } catch (error) {
            console.error('Error creating story:', error);
            toast.error(error.message || 'Failed to create story. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div 
                className={`modal-content ${isClosing ? 'closing' : ''}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Create New Story</h2>
                    <p>Choose how you'd like to create your story</p>
                </div>

                <div className="options-container">
                    <div 
                        className={`option-card ${selectedOption === 'manual' ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect('manual')}
                    >
                        <div className="option-icon">
                            <FaPen />
                        </div>
                        <h3 className="option-title">Manual Writing</h3>
                        <p className="option-description">
                            Write your story from scratch with our intuitive editor. 
                            Perfect for when you want complete creative control.
                        </p>
                    </div>

                    <div 
                        className={`option-card ${selectedOption === 'automated' ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect('automated')}
                    >
                        <div className="option-icon">
                            <FaRobot />
                        </div>
                        <h3 className="option-title">AI-Assisted Writing</h3>
                        <p className="option-description">
                            Let our AI help you generate story ideas and content based on your input.
                            Great for overcoming writer's block.
                        </p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button 
                        className="cancel-button"
                        onClick={handleClose}
                    >
                        <FaTimes /> Cancel
                    </button>
                    <button 
                        className="continue-button"
                        onClick={handleContinue}
                        disabled={!selectedOption}
                    >
                        Continue <FaArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
} 