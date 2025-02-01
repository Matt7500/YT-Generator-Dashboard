import React, { useState, useEffect } from 'react';
import { FaPen } from 'react-icons/fa';
import supabase from '../utils/supabase';
import '../css/NewStoryModal.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function NewStoryModal({ isOpen, onClose, channelId }) {
    const navigate = useNavigate();
    const [isClosing, setIsClosing] = useState(false);
    const initialFormState = {
        title: '',
        genre: '',
        premise: ''
    };

    const [storyData, setStoryData] = useState(initialFormState);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStoryData(initialFormState);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStoryData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No authenticated user');

            const { data, error } = await supabase
                .from('stories')
                .insert([{
                    title: storyData.title,
                    genre: storyData.genre,
                    premise: storyData.premise,
                    user_id: session.user.id,
                    channel_id: channelId,
                    status: 'draft'
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Story created successfully!');
            handleClose();
            navigate(`/story-writer/${data.id}`);
        } catch (error) {
            console.error('Error creating story:', error);
            toast.error('Failed to create story. Please try again.');
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setStoryData(initialFormState);
        }, 300); // Match this with CSS animation duration
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`modal-content ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Story</h2>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="title">Story Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={storyData.title}
                            onChange={handleChange}
                            placeholder="Enter story title"
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="genre">Story Genre</label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            value={storyData.genre}
                            onChange={handleChange}
                            placeholder="Enter story genre"
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="premise">Story Premise</label>
                        <textarea
                            id="premise"
                            name="premise"
                            value={storyData.premise}
                            onChange={handleChange}
                            placeholder="Enter story premise"
                            required
                            className="form-textarea"
                            rows="4"
                        />
                    </div>
                    <div className="modal-actions">
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="submit-button"
                        >
                            <FaPen /> Create Story
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 