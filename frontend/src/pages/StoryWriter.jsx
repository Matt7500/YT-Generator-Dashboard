import React, { useState } from 'react';
import '../css/StoryWriter.css';

const StoryWriter = () => {
    const [scenes, setScenes] = useState([
        { content: 'This is the first scene of our story...', id: 1, isComplete: true },
        { content: 'In the second scene, our hero...', id: 2, isComplete: true },
        { content: '', id: 3, isComplete: false },
        { content: '', id: 4, isComplete: false }
    ]);
    const [currentScene, setCurrentScene] = useState(1);
    const [storyInfo, setStoryInfo] = useState({
        title: "The Adventure Begins",
        channel: "Gaming & Entertainment",
        targetAudience: "13-24 years",
        genre: "Adventure/Tutorial",
        estimatedDuration: "15-20 minutes",
        status: "In Progress",
        lastEdited: new Date().toLocaleDateString()
    });

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
            <div className="fixed-elements-container">
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
                
                <div className="story-info-card">
                    <div className="story-info-header">
                        <h3 className="story-info-title">{storyInfo.title}</h3>
                    </div>
                    
                    <div className="word-count">
                        <div className="word-count-value">{calculateTotalWords()}</div>
                        <div className="word-count-label">Total Words</div>
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
                <div className="story-writer-header">
                    <p className="subtitle">Create and edit your story scenes</p>
                </div>
                
                <div className="story-editor">
                    <div className="scene-section">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryWriter; 