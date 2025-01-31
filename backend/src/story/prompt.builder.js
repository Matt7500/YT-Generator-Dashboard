export function buildPrompt(story, previousScenes = [], options = {}) {
    const {
        regenerating = false,
        currentScene = null,
        feedback = null
    } = options;

    let prompt = `You are a creative writing assistant helping to write a story.

Story Details:
Title: ${story.title}
Genre: ${story.genre}
Premise: ${story.premise}

Previous Scenes:
${previousScenes.map((scene, index) => `Scene ${index + 1}:\n${scene.content}\n`).join('\n')}

${regenerating ? buildRegenerationPrompt(currentScene, feedback) : buildNewScenePrompt()}

Requirements:
- Write in a clear, engaging style
- Focus on showing rather than telling
- Include meaningful dialogue and character development
- Maintain consistency with previous scenes
- Each scene should advance the plot while revealing character
- Aim for 300-500 words per scene

Please write the next scene:`;

    return prompt;
}

function buildNewScenePrompt() {
    return `Based on the story premise and previous scenes (if any), write the next scene that naturally progresses the story. Consider:
- What conflicts or challenges should be introduced or developed
- How to deepen character relationships and development
- What new information or plot elements to reveal
- How to maintain pacing and engagement`;
}

function buildRegenerationPrompt(currentScene, feedback) {
    return `I need you to rewrite the following scene, taking into account the feedback provided:

Current Scene:
${currentScene.content}

Feedback:
${feedback}

Please rewrite the scene while:
- Addressing the specific feedback provided
- Maintaining the core story elements and character development
- Ensuring consistency with the overall narrative
- Improving the writing quality and engagement`;
}

export function buildFeedbackPrompt(sceneContent, feedback) {
    return `Please analyze this writing feedback and extract key learning points:

Scene Content:
${sceneContent}

User Feedback:
${feedback}

Please identify:
1. Main areas for improvement
2. Specific writing techniques to apply
3. Elements that worked well
4. Suggestions for future scenes

This analysis will be used to improve future scene generations.`;
} 