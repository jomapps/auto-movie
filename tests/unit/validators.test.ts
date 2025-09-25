import { describe, it, expect, beforeEach } from 'vitest';
import * as validators from '../../src/utils/validators';

/**
 * Unit Tests: Validation Functions
 * 
 * This test suite validates all input validation functions used
 * throughout the AI Movie Platform API endpoints, ensuring they
 * properly validate user inputs, sanitize data, and provide
 * appropriate error messages.
 * 
 * Coverage includes:
 * - Chat message validation
 * - Project creation validation  
 * - File upload validation
 * - User input sanitization
 * - API request validation
 */

describe('Chat Message Validators', () => {
  describe('validateChatMessage', () => {
    it('should validate correct chat message format', () => {
      const validMessage = {
        projectId: 'project-123',
        sessionId: 'session-456',
        message: 'This is a valid chat message',
        userId: 'user-789'
      };

      const result = validators.validateChatMessage(validMessage);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitized).toEqual(validMessage);
    });

    it('should reject messages that are too short', () => {
      const shortMessage = {
        projectId: 'project-123',
        sessionId: 'session-456',
        message: 'Hi',
        userId: 'user-789'
      };

      const result = validators.validateChatMessage(shortMessage);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be at least 3 characters long');
    });

    it('should reject messages that are too long', () => {
      const longMessage = {
        projectId: 'project-123',
        sessionId: 'session-456',
        message: 'x'.repeat(5001), // Over 5000 character limit
        userId: 'user-789'
      };

      const result = validators.validateChatMessage(longMessage);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be less than 5000 characters');
    });

    it('should sanitize potentially dangerous content', () => {
      const dangerousMessage = {
        projectId: 'project-123',
        sessionId: 'session-456',
        message: 'Hello <script>alert("xss")</script> world',
        userId: 'user-789'
      };

      const result = validators.validateChatMessage(dangerousMessage);

      expect(result.isValid).toBe(true);
      expect(result.sanitized.message).not.toContain('<script>');
      expect(result.sanitized.message).not.toContain('alert');
      expect(result.sanitized.message).toContain('Hello');
      expect(result.sanitized.message).toContain('world');
    });

    it('should validate required fields are present', () => {
      const missingFields = {
        projectId: 'project-123',
        // Missing sessionId, message, userId
      };

      const result = validators.validateChatMessage(missingFields);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session ID is required');
      expect(result.errors).toContain('Message is required');
      expect(result.errors).toContain('User ID is required');
    });

    it('should validate ID formats', () => {
      const invalidIds = {
        projectId: 'invalid-id-format-!@#',
        sessionId: '',
        message: 'Valid message content',
        userId: '123' // Too short
      };

      const result = validators.validateChatMessage(invalidIds);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Project ID'))).toBe(true);
      expect(result.errors.some(error => error.includes('Session ID'))).toBe(true);
      expect(result.errors.some(error => error.includes('User ID'))).toBe(true);
    });
  });

  describe('validateChoiceSelection', () => {
    it('should validate correct choice selection', () => {
      const validChoice = {
        sessionId: 'session-123',
        choiceId: 'choice-456',
        userId: 'user-789'
      };

      const result = validators.validateChoiceSelection(validChoice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid choice selection', () => {
      const invalidChoice = {
        sessionId: '',
        choiceId: null,
        userId: undefined
      };

      const result = validators.validateChoiceSelection(invalidChoice);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Project Validation', () => {
  describe('validateProjectCreation', () => {
    it('should validate correct project creation data', () => {
      const validProject = {
        title: 'My Amazing Movie',
        description: 'An epic adventure story about courage and friendship',
        genre: 'Adventure',
        episodeCount: 5,
        targetAudience: 'PG-13',
        createdBy: 'user-123'
      };

      const result = validators.validateProjectCreation(validProject);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitized.title).toBe('My Amazing Movie');
    });

    it('should reject projects with invalid title', () => {
      const invalidTitles = [
        { title: '', genre: 'Action', episodeCount: 1, createdBy: 'user-123' },
        { title: 'x'.repeat(101), genre: 'Action', episodeCount: 1, createdBy: 'user-123' },
        { title: '<script>alert("xss")</script>', genre: 'Action', episodeCount: 1, createdBy: 'user-123' }
      ];

      invalidTitles.forEach(project => {
        const result = validators.validateProjectCreation(project);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('title') || error.includes('Title'))).toBe(true);
      });
    });

    it('should validate episode count ranges', () => {
      const testCases = [
        { episodeCount: 0, shouldBeValid: false },
        { episodeCount: 1, shouldBeValid: true },
        { episodeCount: 25, shouldBeValid: true },
        { episodeCount: 50, shouldBeValid: true },
        { episodeCount: 51, shouldBeValid: false },
        { episodeCount: -1, shouldBeValid: false },
        { episodeCount: 1.5, shouldBeValid: false }
      ];

      testCases.forEach(({ episodeCount, shouldBeValid }) => {
        const project = {
          title: 'Test Project',
          genre: 'Action',
          episodeCount,
          createdBy: 'user-123'
        };

        const result = validators.validateProjectCreation(project);
        expect(result.isValid).toBe(shouldBeValid);

        if (!shouldBeValid) {
          expect(result.errors.some(error => 
            error.includes('episode') || error.includes('Episode')
          )).toBe(true);
        }
      });
    });

    it('should validate genre options', () => {
      const validGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation', 'Fantasy', 'Mystery', 'Adventure'];
      const invalidGenres = ['InvalidGenre', '', null, undefined, 123];

      validGenres.forEach(genre => {
        const project = {
          title: 'Test Project',
          genre,
          episodeCount: 5,
          createdBy: 'user-123'
        };

        const result = validators.validateProjectCreation(project);
        expect(result.isValid).toBe(true);
      });

      invalidGenres.forEach(genre => {
        const project = {
          title: 'Test Project',
          genre,
          episodeCount: 5,
          createdBy: 'user-123'
        };

        const result = validators.validateProjectCreation(project);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('genre') || error.includes('Genre')
        )).toBe(true);
      });
    });

    it('should sanitize description field', () => {
      const projectWithHtml = {
        title: 'Test Project',
        description: 'A great movie with <strong>action</strong> and <script>alert("xss")</script>',
        genre: 'Action',
        episodeCount: 3,
        createdBy: 'user-123'
      };

      const result = validators.validateProjectCreation(projectWithHtml);

      expect(result.isValid).toBe(true);
      expect(result.sanitized.description).toContain('<strong>action</strong>'); // Safe HTML preserved
      expect(result.sanitized.description).not.toContain('<script>'); // Dangerous HTML removed
      expect(result.sanitized.description).not.toContain('alert');
    });
  });

  describe('validateProjectUpdate', () => {
    it('should validate project updates with partial data', () => {
      const partialUpdate = {
        title: 'Updated Title',
        description: 'Updated description'
        // episodeCount and genre intentionally omitted
      };

      const result = validators.validateProjectUpdate(partialUpdate);

      expect(result.isValid).toBe(true);
      expect(result.sanitized.title).toBe('Updated Title');
      expect(result.sanitized.description).toBe('Updated description');
    });

    it('should reject updates with invalid data types', () => {
      const invalidUpdate = {
        title: 123, // Should be string
        episodeCount: '5', // Should be number
        status: 'invalid-status' // Should be valid status enum
      };

      const result = validators.validateProjectUpdate(invalidUpdate);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('File Upload Validation', () => {
  describe('validateFileUpload', () => {
    it('should validate correct image file metadata', () => {
      const validFile = {
        filename: 'test-image.jpg',
        mimeType: 'image/jpeg',
        size: 1048576, // 1MB
        projectId: 'project-123',
        userId: 'user-456'
      };

      const result = validators.validateFileUpload(validFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        filename: 'huge-file.jpg',
        mimeType: 'image/jpeg',
        size: 52428800, // 50MB - over limit
        projectId: 'project-123',
        userId: 'user-456'
      };

      const result = validators.validateFileUpload(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('size') || error.includes('large'))).toBe(true);
    });

    it('should validate supported file types', () => {
      const supportedTypes = [
        { mimeType: 'image/jpeg', filename: 'test.jpg' },
        { mimeType: 'image/png', filename: 'test.png' },
        { mimeType: 'image/gif', filename: 'test.gif' },
        { mimeType: 'video/mp4', filename: 'test.mp4' },
        { mimeType: 'audio/mpeg', filename: 'test.mp3' },
        { mimeType: 'application/pdf', filename: 'test.pdf' }
      ];

      const unsupportedTypes = [
        { mimeType: 'application/x-executable', filename: 'virus.exe' },
        { mimeType: 'text/html', filename: 'page.html' },
        { mimeType: 'application/zip', filename: 'archive.zip' }
      ];

      supportedTypes.forEach(({ mimeType, filename }) => {
        const file = {
          filename,
          mimeType,
          size: 1024,
          projectId: 'project-123',
          userId: 'user-456'
        };

        const result = validators.validateFileUpload(file);
        expect(result.isValid).toBe(true);
      });

      unsupportedTypes.forEach(({ mimeType, filename }) => {
        const file = {
          filename,
          mimeType,
          size: 1024,
          projectId: 'project-123',
          userId: 'user-456'
        };

        const result = validators.validateFileUpload(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('type') || error.includes('format') || error.includes('supported')
        )).toBe(true);
      });
    });

    it('should sanitize filename', () => {
      const dangerousFile = {
        filename: '../../../etc/passwd',
        mimeType: 'image/jpeg',
        size: 1024,
        projectId: 'project-123',
        userId: 'user-456'
      };

      const result = validators.validateFileUpload(dangerousFile);

      expect(result.isValid).toBe(true);
      expect(result.sanitized.filename).not.toContain('../');
      expect(result.sanitized.filename).not.toContain('/');
      expect(result.sanitized.filename).toContain('passwd');
    });

    it('should validate required metadata fields', () => {
      const incompleteFile = {
        filename: 'test.jpg'
        // Missing mimeType, size, projectId, userId
      };

      const result = validators.validateFileUpload(incompleteFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MIME type is required');
      expect(result.errors).toContain('File size is required');
      expect(result.errors).toContain('Project ID is required');
      expect(result.errors).toContain('User ID is required');
    });
  });

  describe('validateBulkFileUpload', () => {
    it('should validate multiple files in bulk', () => {
      const files = [
        { filename: 'file1.jpg', mimeType: 'image/jpeg', size: 1024 },
        { filename: 'file2.png', mimeType: 'image/png', size: 2048 },
        { filename: 'file3.mp4', mimeType: 'video/mp4', size: 5048576 }
      ];

      const projectId = 'project-123';
      const userId = 'user-456';

      const result = validators.validateBulkFileUpload(files, projectId, userId);

      expect(result.isValid).toBe(true);
      expect(result.validFiles).toHaveLength(3);
      expect(result.invalidFiles).toHaveLength(0);
    });

    it('should separate valid and invalid files', () => {
      const mixedFiles = [
        { filename: 'valid.jpg', mimeType: 'image/jpeg', size: 1024 },
        { filename: 'toolarge.jpg', mimeType: 'image/jpeg', size: 52428800 }, // Too large
        { filename: 'invalid.exe', mimeType: 'application/x-executable', size: 1024 }, // Unsupported
        { filename: 'valid2.png', mimeType: 'image/png', size: 2048 }
      ];

      const result = validators.validateBulkFileUpload(mixedFiles, 'project-123', 'user-456');

      expect(result.validFiles).toHaveLength(2);
      expect(result.invalidFiles).toHaveLength(2);
      expect(result.validFiles[0].filename).toBe('valid.jpg');
      expect(result.validFiles[1].filename).toBe('valid2.png');
    });

    it('should enforce bulk upload limits', () => {
      const tooManyFiles = Array.from({ length: 21 }, (_, i) => ({
        filename: `file${i}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024
      }));

      const result = validators.validateBulkFileUpload(tooManyFiles, 'project-123', 'user-456');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 20 files allowed per batch upload');
    });
  });
});

describe('User Input Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should preserve safe HTML elements', () => {
      const safeHtml = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      
      const result = validators.sanitizeHtml(safeHtml);
      
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
    });

    it('should remove dangerous HTML elements', () => {
      const dangerousHtml = '<script>alert("xss")</script><img src="x" onerror="alert(1)"><iframe src="evil.com"></iframe>';
      
      const result = validators.sanitizeHtml(dangerousHtml);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('alert');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<p><div><span>Unclosed tags</p>';
      
      const result = validators.sanitizeHtml(malformedHtml);
      
      expect(result).toBe('Unclosed tags');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      const dangerousFilenames = [
        '../../../etc/passwd',
        '..\\windows\\system32\\config\\sam',
        'normal-file.jpg',
        'file with spaces.png'
      ];

      dangerousFilenames.forEach(filename => {
        const result = validators.sanitizeFilename(filename);
        
        expect(result).not.toContain('../');
        expect(result).not.toContain('..\\');
        expect(result).not.toMatch(/[<>:"|?*]/);
      });
    });

    it('should preserve valid filename characters', () => {
      const validFilename = 'my-awesome-file_v2.jpg';
      
      const result = validators.sanitizeFilename(validFilename);
      
      expect(result).toBe(validFilename);
    });
  });
});

describe('API Request Validation', () => {
  describe('validateApiRequest', () => {
    it('should validate request structure and headers', () => {
      const mockRequest = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer valid-token-123'
        },
        body: JSON.stringify({
          projectId: 'project-123',
          message: 'Valid request body'
        })
      };

      const result = validators.validateApiRequest(mockRequest);

      expect(result.isValid).toBe(true);
      expect(result.parsedBody).toEqual({
        projectId: 'project-123',
        message: 'Valid request body'
      });
    });

    it('should reject requests with invalid JSON', () => {
      const invalidRequest = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ invalid json }'
      };

      const result = validators.validateApiRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('JSON'))).toBe(true);
    });

    it('should validate required headers', () => {
      const requestMissingHeaders = {
        method: 'POST',
        headers: {},
        body: '{}'
      };

      const result = validators.validateApiRequest(requestMissingHeaders, { requireAuth: true });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('authorization') || error.includes('Authorization'))).toBe(true);
    });

    it('should validate HTTP methods', () => {
      const invalidMethodRequest = {
        method: 'INVALID',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      };

      const result = validators.validateApiRequest(invalidMethodRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('method') || error.includes('HTTP'))).toBe(true);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle null and undefined inputs gracefully', () => {
    const nullTests = [
      () => validators.validateChatMessage(null),
      () => validators.validateProjectCreation(undefined),
      () => validators.validateFileUpload(null),
      () => validators.sanitizeHtml(null),
      () => validators.sanitizeFilename(undefined)
    ];

    nullTests.forEach(test => {
      const result = test();
      if (result && typeof result === 'object' && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      } else {
        expect(result).toBeDefined(); // Should return something, not crash
      }
    });
  });

  it('should handle extremely long inputs without crashing', () => {
    const extremeInput = 'x'.repeat(100000);

    const result = validators.validateChatMessage({
      projectId: 'project-123',
      sessionId: 'session-456',
      message: extremeInput,
      userId: 'user-789'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('too long') || error.includes('characters'))).toBe(true);
  });

  it('should handle special Unicode characters', () => {
    const unicodeMessage = {
      projectId: 'project-123',
      sessionId: 'session-456',
      message: 'Hello 世界 🌍 Здравствуй мир! 🚀',
      userId: 'user-789'
    };

    const result = validators.validateChatMessage(unicodeMessage);

    expect(result.isValid).toBe(true);
    expect(result.sanitized.message).toContain('世界');
    expect(result.sanitized.message).toContain('🌍');
    expect(result.sanitized.message).toContain('мир');
  });
});