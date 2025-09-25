/**
 * LLM Prompt Templates
 * Standardized prompts for consistent AI responses
 */

export interface PromptContext {
  projectTitle: string
  genre: string
  currentStep: string
  progress: number
  episodeCount: number
  description?: string
  targetAudience?: string
  userMessage?: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}

/**
 * System prompt for movie production AI assistant
 */
export function buildSystemPrompt(context: PromptContext): string {
  return `You are an AI assistant specialized in movie production guidance.

**Project Context:**
- Title: "${context.projectTitle}"
- Genre: ${context.genre}
- Current Step: ${context.currentStep}
- Progress: ${context.progress}%
- Episodes: ${context.episodeCount}
${context.description ? `- Description: ${context.description}` : ''}
${context.targetAudience ? `- Target Audience: ${context.targetAudience}` : ''}

**Your Role:**
You guide users through the movie production workflow with expertise in:
1. Story development and narrative structure
2. Character creation and development  
3. Visual design and cinematography
4. Production planning and execution
5. Post-production and editing

**Communication Style:**
- Be enthusiastic and encouraging about their creative vision
- Provide specific, actionable advice tailored to their project
- Ask clarifying questions when you need more details
- Reference their uploaded files and previous conversations
- Offer multiple approaches when appropriate
- Keep responses focused but comprehensive (200-400 words typically)

**Current Workflow Step: ${context.currentStep}**
${getStepGuidance(context.currentStep)}

**Response Format:**
1. Address their specific question or comment
2. Provide relevant guidance for current step
3. Suggest specific next actions
4. End with 2-3 choice options when appropriate

Always maintain enthusiasm for their creative project while providing practical guidance.`
}

/**
 * Get step-specific guidance text
 */
function getStepGuidance(step: string): string {
  const stepGuidance: Record<string, string> = {
    concept: `
**Focus Areas:**
- Core concept and unique selling proposition
- Genre conventions and audience expectations
- Tone, style, and overall vision
- Market research and competitive analysis`,

    story: `
**Focus Areas:**
- Three-act structure and plot development
- Episode breakdown and story arcs
- Character motivations and conflicts
- Pacing and narrative flow
- Theme and message development`,

    characters: `
**Focus Areas:**
- Main character profiles and backstories
- Character relationships and dynamics
- Visual design and personality traits
- Character arcs and development
- Voice and dialogue patterns`,

    storyboard: `
**Focus Areas:**
- Visual storytelling and composition
- Shot types and camera angles
- Scene transitions and pacing
- Visual style and mood
- Technical production considerations`,

    assets: `
**Focus Areas:**
- Concept art and visual references
- Character design and environments
- Props and costume design
- Color palettes and visual themes
- Asset organization and management`,

    production: `
**Focus Areas:**
- Scene generation and assembly
- Quality control and consistency
- Technical specifications
- Timeline and resource management
- Collaboration and workflow optimization`,

    review: `
**Focus Areas:**
- Quality assessment and feedback
- Consistency checks across episodes
- Final polish and refinements
- Testing and validation
- Preparation for distribution`
  }

  return stepGuidance[step] || 'Provide general movie production guidance based on current needs.'
}

/**
 * Prompt for choice processing
 */
export function buildChoicePrompt(
  choiceId: string,
  choiceTitle: string,
  context: PromptContext
): string {
  return `The user has selected: "${choiceTitle}" (ID: ${choiceId})

**Project Context:** ${context.projectTitle} (${context.genre})
**Current Step:** ${context.currentStep}

Respond with:
1. **Confirmation** - Acknowledge their choice enthusiastically
2. **Next Steps** - Specific actions they should take now
3. **Guidance** - Detailed advice for executing this choice
4. **Follow-up** - What comes after completing this action

Keep the response practical and encouraging. Include specific examples relevant to their ${context.genre} project.`
}

/**
 * Prompt for step transitions
 */
export function buildStepTransitionPrompt(
  fromStep: string,
  toStep: string,
  context: PromptContext
): string {
  return `Transitioning from "${fromStep}" to "${toStep}" for "${context.projectTitle}".

**Project Status:**
- Genre: ${context.genre}
- Episodes: ${context.episodeCount}
- Progress: ${context.progress}%

Provide:
1. **Welcome** - Celebrate completing the previous step
2. **Overview** - What they'll accomplish in "${toStep}"
3. **Getting Started** - First specific actions to take
4. **Expectations** - What success looks like in this phase

Make this transition feel natural and motivating. Focus on their ${context.genre} project specifics.`
}

/**
 * Prompt for file upload processing
 */
export function buildFileUploadPrompt(
  fileTypes: string[],
  context: PromptContext
): string {
  return `The user has uploaded ${fileTypes.length} file(s): ${fileTypes.join(', ')}

**Project:** ${context.projectTitle} (${context.genre})
**Current Step:** ${context.currentStep}

Analyze the uploaded files and:
1. **Acknowledge** - Thank them for the upload
2. **Analysis** - Describe what you see and how it fits their project
3. **Integration** - How to use these files in current workflow step
4. **Next Steps** - Specific actions based on the uploaded content

Be specific about how these files enhance their ${context.genre} project.`
}

/**
 * Prompt for manual override requests
 */
export function buildManualOverridePrompt(
  userInstruction: string,
  context: PromptContext
): string {
  return `The user wants to manually override the standard workflow:
"${userInstruction}"

**Project:** ${context.projectTitle} (${context.genre})
**Current Step:** ${context.currentStep}

Respond with:
1. **Understanding** - Confirm you understand their custom approach
2. **Guidance** - How to implement their specific idea
3. **Considerations** - Potential challenges or opportunities
4. **Integration** - How this fits with the overall project

Be flexible and supportive of their creative vision while providing practical guidance.`
}

/**
 * Prompt for error recovery
 */
export function buildErrorRecoveryPrompt(
  errorType: string,
  context: PromptContext
): string {
  return `There was an issue: ${errorType}

**Project:** ${context.projectTitle} (${context.genre})
**Step:** ${context.currentStep}

Provide:
1. **Reassurance** - This is normal and solvable
2. **Explanation** - What likely happened
3. **Solutions** - 2-3 different approaches to resolve this
4. **Prevention** - How to avoid this issue in the future

Stay positive and solution-focused.`
}

/**
 * Prompt for project completion
 */
export function buildCompletionPrompt(context: PromptContext): string {
  return `Congratulations! "${context.projectTitle}" is complete!

**Final Project Stats:**
- Genre: ${context.genre}
- Episodes: ${context.episodeCount}
- Progress: 100%

Provide:
1. **Celebration** - Acknowledge their achievement
2. **Summary** - Key accomplishments and highlights
3. **Next Steps** - Distribution, sharing, or next project ideas
4. **Reflection** - What they learned and created

Make this a memorable conclusion to their creative journey.`
}

/**
 * Build context-aware user prompt
 */
export function buildContextPrompt(
  userMessage: string,
  context: PromptContext,
  additionalContext?: string
): string {
  let prompt = `User message: "${userMessage}"\n\n`
  
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    prompt += `**Recent conversation context:**\n`
    context.conversationHistory.slice(-3).forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`
    })
    prompt += '\n'
  }

  if (additionalContext) {
    prompt += `**Additional context:** ${additionalContext}\n\n`
  }

  prompt += `Respond naturally to their message while staying focused on their ${context.genre} project "${context.projectTitle}" in the ${context.currentStep} phase.`

  return prompt
}

/**
 * Choice generation prompt
 */
export function generateChoicesPrompt(context: PromptContext): string {
  return `Generate 3 choice options for the user's ${context.genre} project "${context.projectTitle}" in the ${context.currentStep} phase.

Each choice should:
1. **Be specific** to their project and current step
2. **Offer different approaches** (recommended, alternative, creative)
3. **Include clear titles and descriptions**
4. **Show different difficulty/time commitments**

Format as JSON with this structure:
{
  "choices": [
    {
      "id": "choice_1",
      "title": "Recommended Action",
      "description": "Specific description of what they'll do",
      "type": "recommended",
      "metadata": {
        "difficulty": "easy|medium|hard",
        "timeEstimate": "X hours",
        "impact": "low|medium|high"
      }
    }
  ]
}`
}

export default {
  buildSystemPrompt,
  buildChoicePrompt,
  buildStepTransitionPrompt,
  buildFileUploadPrompt,
  buildManualOverridePrompt,
  buildErrorRecoveryPrompt,
  buildCompletionPrompt,
  buildContextPrompt,
  generateChoicesPrompt,
}