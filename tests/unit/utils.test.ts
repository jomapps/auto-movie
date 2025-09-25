import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as prompts from '../../src/utils/prompts';
import * as formatters from '../../src/utils/formatters';
import * as logger from '../../src/utils/logger';
import { getPayload } from '../../src/utils/getPayload';

/**
 * Unit Tests: Utility Functions
 * 
 * This test suite validates all utility functions used throughout
 * the AI Movie Platform, ensuring they handle various inputs
 * correctly and maintain consistent behavior.
 * 
 * Coverage includes:
 * - Prompt template generation and validation
 * - Response formatting functions
 * - Logging utilities
 * - PayloadCMS helper functions
 */

describe('Prompt Templates Utility', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  describe('generateInitialPrompt', () => {
    it('should generate initial prompt with project context', () => {
      const projectData = {
        title: 'Test Movie',
        genre: 'Action',
        episodeCount: 5,
        description: 'An exciting action movie'
      };

      const result = prompts.generateInitialPrompt(projectData);

      expect(result).toContain('Test Movie');
      expect(result).toContain('Action');
      expect(result).toContain('5');
      expect(result).toContain('exciting action movie');
      expect(result).toMatch(/welcome|start|begin/i);
    });

    it('should handle missing optional project fields', () => {
      const minimalProject = {
        title: 'Minimal Movie',
        genre: 'Drama'
      };

      const result = prompts.generateInitialPrompt(minimalProject);

      expect(result).toContain('Minimal Movie');
      expect(result).toContain('Drama');
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });

    it('should escape special characters in project data', () => {
      const projectWithSpecialChars = {
        title: 'Movie "With" Special & Characters <test>',
        genre: 'Comedy',
        description: 'Contains quotes "and" ampersands & brackets <>'
      };

      const result = prompts.generateInitialPrompt(projectWithSpecialChars);

      expect(result).not.toContain('<script>');
      expect(result).not.toMatch(/[<>]/);
      expect(result).toContain('Movie');
      expect(result).toContain('Special');
      expect(result).toContain('Characters');
    });
  });

  describe('generateContextPrompt', () => {
    it('should generate context-aware prompt with conversation history', () => {
      const context = {
        currentStep: 'character-development',
        conversationHistory: [
          { role: 'user', content: 'I want to create a hero character' },
          { role: 'assistant', content: 'Great! Let\'s develop your hero character.' }
        ],
        mediaReferences: ['character-sketch-1.jpg']
      };

      const result = prompts.generateContextPrompt(context);

      expect(result).toContain('character-development');
      expect(result).toContain('hero character');
      expect(result).toContain('character-sketch-1.jpg');
      expect(result).toMatch(/context|previous|continue/i);
    });

    it('should handle empty conversation history', () => {
      const emptyContext = {
        currentStep: 'initial',
        conversationHistory: [],
        mediaReferences: []
      };

      const result = prompts.generateContextPrompt(emptyContext);

      expect(result).toContain('initial');
      expect(result).not.toContain('undefined');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should limit conversation history to prevent prompt overflow', () => {
      const longHistory = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} with some content that might be quite long`
      }));

      const context = {
        currentStep: 'test',
        conversationHistory: longHistory,
        mediaReferences: []
      };

      const result = prompts.generateContextPrompt(context);

      // Should not include all 100 messages
      const messageCount = (result.match(/Message \d+/g) || []).length;
      expect(messageCount).toBeLessThan(50); // Should be truncated
      expect(result.length).toBeLessThan(8000); // Reasonable prompt length
    });
  });

  describe('generateChoicePrompt', () => {
    it('should generate prompt for choice presentation', () => {
      const choiceData = {
        step: 'plot-development',
        options: [
          { id: '1', title: 'Linear narrative', description: 'Traditional storytelling approach' },
          { id: '2', title: 'Non-linear narrative', description: 'Flashbacks and time jumps' },
          { id: '3', title: 'Multiple perspectives', description: 'Different character viewpoints' }
        ],
        context: 'User is deciding on narrative structure'
      };

      const result = prompts.generateChoicePrompt(choiceData);

      expect(result).toContain('plot-development');
      expect(result).toContain('Linear narrative');
      expect(result).toContain('Non-linear narrative');
      expect(result).toContain('Multiple perspectives');
      expect(result).toContain('narrative structure');
      expect(result).toMatch(/choose|select|option/i);
    });

    it('should handle single choice option', () => {
      const singleChoice = {
        step: 'confirmation',
        options: [
          { id: '1', title: 'Proceed', description: 'Continue with current plan' }
        ],
        context: 'Final confirmation step'
      };

      const result = prompts.generateChoicePrompt(singleChoice);

      expect(result).toContain('Proceed');
      expect(result).toContain('confirmation');
      expect(result).not.toContain('undefined');
    });
  });
});

describe('Response Formatters Utility', () => {
  describe('formatChatResponse', () => {
    it('should format basic AI response correctly', () => {
      const rawResponse = {
        content: 'This is a test response from the AI system.',
        choices: [
          { id: '1', title: 'Option 1', description: 'First option' },
          { id: '2', title: 'Option 2', description: 'Second option' }
        ]
      };

      const result = formatters.formatChatResponse(rawResponse);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('choices');
      expect(result).toHaveProperty('metadata');
      
      expect(result.message).toBe(rawResponse.content);
      expect(result.choices).toHaveLength(2);
      expect(result.choices[0]).toHaveProperty('id', '1');
      expect(result.choices[0]).toHaveProperty('title', 'Option 1');
    });

    it('should handle response without choices', () => {
      const responseNoChoices = {
        content: 'This is a simple response without choices.',
        choices: []
      };

      const result = formatters.formatChatResponse(responseNoChoices);

      expect(result.message).toBe(responseNoChoices.content);
      expect(result.choices).toEqual([]);
      expect(result.metadata).toBeDefined();
    });

    it('should sanitize potentially unsafe content', () => {
      const unsafeResponse = {
        content: 'Response with <script>alert("xss")</script> and other <img onerror="alert(1)" src="x"> tags',
        choices: []
      };

      const result = formatters.formatChatResponse(unsafeResponse);

      expect(result.message).not.toContain('<script>');
      expect(result.message).not.toContain('onerror');
      expect(result.message).not.toContain('alert');
      expect(result.message).toContain('Response with');
    });

    it('should preserve safe HTML formatting', () => {
      const formattedResponse = {
        content: 'Response with <strong>bold</strong> and <em>italic</em> text.',
        choices: []
      };

      const result = formatters.formatChatResponse(formattedResponse);

      expect(result.message).toContain('<strong>');
      expect(result.message).toContain('<em>');
      expect(result.message).toContain('bold');
      expect(result.message).toContain('italic');
    });
  });

  describe('formatProjectProgress', () => {
    it('should calculate and format project progress correctly', () => {
      const projectData = {
        currentStep: 'character-development',
        completedSteps: ['concept', 'genre-selection', 'initial-planning'],
        totalSteps: 10
      };

      const result = formatters.formatProjectProgress(projectData);

      expect(result).toHaveProperty('percentage');
      expect(result).toHaveProperty('currentPhase');
      expect(result).toHaveProperty('completedSteps');
      expect(result).toHaveProperty('nextSteps');

      expect(result.percentage).toBe(30); // 3 out of 10 steps completed
      expect(result.currentPhase).toBe('character-development');
      expect(result.completedSteps).toHaveLength(3);
    });

    it('should handle edge cases for progress calculation', () => {
      const edgeCase = {
        currentStep: 'initial',
        completedSteps: [],
        totalSteps: 0
      };

      const result = formatters.formatProjectProgress(edgeCase);

      expect(result.percentage).toBe(0);
      expect(result.completedSteps).toEqual([]);
      expect(typeof result.nextSteps).toBe('object');
    });

    it('should cap progress at 100%', () => {
      const overComplete = {
        currentStep: 'completed',
        completedSteps: Array.from({ length: 15 }, (_, i) => `step-${i}`),
        totalSteps: 10
      };

      const result = formatters.formatProjectProgress(overComplete);

      expect(result.percentage).toBe(100);
      expect(result.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('formatMediaMetadata', () => {
    it('should format media metadata with all fields', () => {
      const mediaData = {
        id: 'media-123',
        filename: 'test-image.jpg',
        size: 1048576, // 1MB in bytes
        mimeType: 'image/jpeg',
        uploadDate: '2024-01-15T10:30:00Z',
        dimensions: { width: 1920, height: 1080 },
        aiDescription: 'A scenic landscape with mountains',
        tags: ['landscape', 'mountains', 'nature']
      };

      const result = formatters.formatMediaMetadata(mediaData);

      expect(result).toHaveProperty('id', 'media-123');
      expect(result).toHaveProperty('displayName', 'test-image.jpg');
      expect(result).toHaveProperty('sizeFormatted', '1.0 MB');
      expect(result).toHaveProperty('type', 'Image');
      expect(result).toHaveProperty('uploadedAt');
      expect(result).toHaveProperty('description', 'A scenic landscape with mountains');
      expect(result.tags).toContain('landscape');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalMedia = {
        id: 'media-456',
        filename: 'minimal.png',
        size: 2048,
        mimeType: 'image/png'
      };

      const result = formatters.formatMediaMetadata(minimalMedia);

      expect(result.id).toBe('media-456');
      expect(result.displayName).toBe('minimal.png');
      expect(result.sizeFormatted).toContain('2.0 KB');
      expect(result.description).toBe('');
      expect(result.tags).toEqual([]);
    });

    it('should format file sizes correctly', () => {
      const testCases = [
        { size: 512, expected: 'B' },
        { size: 1024, expected: '1.0 KB' },
        { size: 1048576, expected: '1.0 MB' },
        { size: 1073741824, expected: '1.0 GB' }
      ];

      testCases.forEach(({ size, expected }) => {
        const media = { id: 'test', filename: 'test.txt', size, mimeType: 'text/plain' };
        const result = formatters.formatMediaMetadata(media);
        expect(result.sizeFormatted).toContain(expected.split(' ')[1] || 'B');
      });
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format paginated response with correct structure', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      };

      const result = formatters.formatPaginatedResponse(data, pagination);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should calculate pagination flags correctly', () => {
      const lastPagePagination = {
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3
      };

      const result = formatters.formatPaginatedResponse([], lastPagePagination);

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });
});

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('log levels', () => {
    it('should log info messages with correct format', () => {
      logger.info('Test info message', { context: 'test' });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message'),
        expect.objectContaining({ context: 'test' })
      );
    });

    it('should log error messages with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { component: 'test' });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Error occurred'),
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error',
            stack: expect.any(String)
          })
        })
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning', { level: 'medium' });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Test warning'),
        expect.objectContaining({ level: 'medium' })
      );
    });
  });

  describe('performance logging', () => {
    it('should log performance metrics', () => {
      const metrics = {
        operation: 'file-upload',
        duration: 1500,
        size: 1048576
      };

      logger.performance('File upload completed', metrics);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[PERF]'),
        expect.stringContaining('File upload completed'),
        expect.objectContaining(metrics)
      );
    });

    it('should format duration correctly', () => {
      logger.performance('Quick operation', { duration: 150 });
      logger.performance('Slow operation', { duration: 5000 });

      expect(console.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('structured logging', () => {
    it('should create structured log entries', () => {
      const logData = {
        userId: 'user-123',
        action: 'project-create',
        projectId: 'project-456',
        timestamp: new Date().toISOString()
      };

      logger.structured('User action', logData);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[STRUCT]'),
        expect.objectContaining(logData)
      );
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: { id: '123', name: 'Test User' },
        project: { title: 'Test Project', settings: { genre: 'Action' } },
        metadata: { version: '1.0', features: ['chat', 'upload'] }
      };

      logger.structured('Complex log entry', complexData);

      expect(console.log).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user: expect.objectContaining({ id: '123' }),
          project: expect.objectContaining({
            title: 'Test Project',
            settings: expect.objectContaining({ genre: 'Action' })
          })
        })
      );
    });
  });
});

describe('PayloadCMS Helper Functions', () => {
  // Mock PayloadCMS instance
  const mockPayload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getPayload to return our mock instance
    vi.mocked(getPayload).mockResolvedValue(mockPayload as any);
  });

  it('should initialize PayloadCMS connection', async () => {
    const payload = await getPayload();
    
    expect(payload).toBeDefined();
    expect(payload).toHaveProperty('find');
    expect(payload).toHaveProperty('findByID');
    expect(payload).toHaveProperty('create');
  });

  it('should handle PayloadCMS connection errors', async () => {
    vi.mocked(getPayload).mockRejectedValueOnce(new Error('Connection failed'));

    await expect(getPayload()).rejects.toThrow('Connection failed');
  });

  it('should provide type-safe collection operations', async () => {
    const mockProject = {
      id: 'project-123',
      title: 'Test Project',
      genre: 'Action',
      createdAt: new Date().toISOString()
    };

    mockPayload.findByID.mockResolvedValueOnce(mockProject);

    const payload = await getPayload();
    const result = await payload.findByID({
      collection: 'projects',
      id: 'project-123'
    });

    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'projects',
      id: 'project-123'
    });
    expect(result).toEqual(mockProject);
  });
});