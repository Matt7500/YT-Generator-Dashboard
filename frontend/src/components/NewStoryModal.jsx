import React, { useState, useEffect } from 'react';
import { FaPen } from 'react-icons/fa';
import '../css/NewStoryModal.css';

export default function NewStoryModal({ isOpen, onClose, onSubmit }) {
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
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStoryData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(storyData);
        onClose();
    };

    const handleClose = () => {
        setStoryData(initialFormState);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
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