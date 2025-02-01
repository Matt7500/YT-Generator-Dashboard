import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import '../css/StoryWriter.css';

const StoryWriter = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [scenes, setScenes] = useState([
        { content: '', id: 1, isComplete: false }
    ]);
    const [currentScene, setCurrentScene] = useState(1);
    const [storyInfo, setStoryInfo] = useState({
        title: "",
        genre: "",
        premise: "",
        status: "draft",
        lastEdited: new Date().toLocaleDateString()
    });

    useEffect(() => {
        const loadStory = async () => {
            try {
                // Get current user session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/login');
                    return;
                }

                // Fetch story data
                const { data: story, error } = await supabase
                    .from('stories')
                    .select('*')
                    .eq('id', storyId)
                    .single();

                if (error) throw error;

                // Verify ownership
                if (story.user_id !== session.user.id) {
                    navigate('/stories');
                    return;
                }

                // Load story data
                setStoryInfo({
                    title: story.title,
                    genre: story.genre,
                    premise: story.premise,
                    status: story.status,
                    lastEdited: new Date(story.updated_at).toLocaleDateString()
                });

                // Load scenes if they exist
                if (story.scenes) {
                    setScenes(story.scenes);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error loading story:', error);
                navigate('/stories');
            }
        };

        if (storyId) {
            loadStory();
        }
    }, [storyId, navigate]);

    const handleSceneChange = (sceneId, content) => {
        setScenes(prevScenes => 
            prevScenes.map(scene => 
                scene.id === sceneId ? { ...scene, content } : scene
            )
        );
    };

    const handleSubmitScene = () => {
        // TODO: Implement scene submission logic
        console.log('Submitting scenes:', scenes);
    };

    const handleFinishStory = () => {
        // TODO: Implement story completion logic
        console.log('Finishing story');
    };

    const handleAddFeedback = () => {
        // TODO: Implement feedback logic
        console.log('Adding feedback for scene:', currentScene);
    };

    const handleRewriteScene = () => {
        // TODO: Implement rewrite logic
        console.log('Rewriting scene:', currentScene);
    };

    const completedScenes = scenes.filter(scene => scene.isComplete).length;
    const progressPercentage = (completedScenes / scenes.length) * 100;

    // Calculate total word count across all scenes
    const calculateTotalWords = () => {
        return scenes.reduce((total, scene) => {
            return total + (scene.content.trim().split(/\s+/).length || 0);
        }, 0);
    };

    return (
        <div className="story-writer">
            <div className="sidebar-spacer" />
            <div className="story-writer-content">
                <div className="story-writer-header">
                    <p className="subtitle">Create and edit your story scenes</p>
                </div>
                
                <div className="story-editor">
                    <div className="scene-section">
                        <div className="editor-toolbar">
                            <div className="toolbar-left">
                                <h2>Scene {currentScene}</h2>
                            </div>
                            <div className="progress-container">
                                <div className="progress-bar-wrapper">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {completedScenes} of {scenes.length} Scenes Complete ({Math.round(progressPercentage)}%)
                                </span>
                            </div>
                            <div className="toolbar-actions">
                                <button
                                    className="toolbar-button feedback"
                                    onClick={handleAddFeedback}
                                >
                                    Add Feedback
                                </button>
                                <button
                                    className="toolbar-button rewrite"
                                    onClick={handleRewriteScene}
                                >
                                    Rewrite Scene
                                </button>
                            </div>
                        </div>
                        
                        <div className="editor-content">
                            <div className="doc-container">
                                {scenes.map((scene) => (
                                    <div key={scene.id} className="doc-page">
                                        <div className="page-header">
                                            <span className="scene-number">Scene {scene.id}</span>
                                        </div>
                                        <textarea
                                            className="scene-textarea"
                                            value={scene.content}
                                            onChange={(e) => handleSceneChange(scene.id, e.target.value)}
                                            placeholder={`Start writing scene ${scene.id} here...`}
                                            spellCheck="true"
                                            onFocus={() => setCurrentScene(scene.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="story-info-card">
                                <div className="story-info-header">
                                    <h3 className="story-info-title">{storyInfo.title}</h3>
                                </div>
                                
                                <div className="word-count">
                                    <div className="word-count-value">{calculateTotalWords()}</div>
                                    <div className="word-count-label">Total Words</div>
                                </div>

                                <div className="story-info-section">
                                    <div className="info-label">Target Audience</div>
                                    <div className="info-value">{storyInfo.targetAudience}</div>
                                </div>

                                <div className="story-info-section">
                                    <div className="info-label">Genre</div>
                                    <div className="info-value">{storyInfo.genre}</div>
                                </div>

                                <div className="story-info-section">
                                    <div className="info-label">Estimated Duration</div>
                                    <div className="info-value">{storyInfo.estimatedDuration}</div>
                                </div>

                                <div className="story-info-section">
                                    <div className="info-label">Status</div>
                                    <div className="info-value">{storyInfo.status}</div>
                                </div>

                                <div className="story-info-section">
                                    <div className="info-label">Last Edited</div>
                                    <div className="info-value">{storyInfo.lastEdited}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="actions-container">
                    <button
                        className="action-button submit-scene"
                        onClick={handleSubmitScene}
                    >
                        Submit Scene
                    </button>
                    <button
                        className="action-button finish-story"
                        onClick={handleFinishStory}
                    >
                        Finish Story
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryWriter; 