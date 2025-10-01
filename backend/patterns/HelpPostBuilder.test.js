const HelpPostBuilder = require('../../../patterns/HelpPostBuilder');

describe('HelpPostBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new HelpPostBuilder();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const helpPost = builder.build();
      
      expect(helpPost).toEqual({
        title: '',
        description: '',
        category: '',
        location: '',
        neededBy: null,
        author: null,
        helpers: [],
        status: 'open'
      });
    });
  });

  describe('setter methods', () => {
    describe('setTitle', () => {
      it('should set title and return builder instance', () => {
        const result = builder.setTitle('Test Title');
        
        expect(result).toBe(builder);
        expect(builder.build().title).toBe('Test Title');
      });
    });

    describe('setDescription', () => {
      it('should set description and return builder instance', () => {
        const result = builder.setDescription('Test Description');
        
        expect(result).toBe(builder);
        expect(builder.build().description).toBe('Test Description');
      });
    });

    describe('setCategory', () => {
      it('should set category and return builder instance', () => {
        const result = builder.setCategory('Shopping');
        
        expect(result).toBe(builder);
        expect(builder.build().category).toBe('Shopping');
      });
    });

    describe('setLocation', () => {
      it('should set location and return builder instance', () => {
        const result = builder.setLocation('Campus Store');
        
        expect(result).toBe(builder);
        expect(builder.build().location).toBe('Campus Store');
      });
    });

    describe('setNeededBy', () => {
      it('should set neededBy date and return builder instance', () => {
        const testDate = new Date('2024-01-15');
        const result = builder.setNeededBy(testDate);
        
        expect(result).toBe(builder);
        expect(builder.build().neededBy).toBe(testDate);
      });
    });

    describe('setAuthor', () => {
      it('should set author and return builder instance', () => {
        const authorId = '507f1f77bcf86cd799439011';
        const result = builder.setAuthor(authorId);
        
        expect(result).toBe(builder);
        expect(builder.build().author).toBe(authorId);
      });
    });

    describe('setStatus', () => {
      it('should set status and return builder instance', () => {
        const result = builder.setStatus('in-progress');
        
        expect(result).toBe(builder);
        expect(builder.build().status).toBe('in-progress');
      });
    });
  });

  describe('method chaining', () => {
    it('should allow chaining multiple setter methods', () => {
      const testDate = new Date('2024-01-15');
      const authorId = '507f1f77bcf86cd799439011';
      
      const result = builder
        .setTitle('Chained Title')
        .setDescription('Chained Description')
        .setCategory('Transport')
        .setLocation('Main Campus')
        .setNeededBy(testDate)
        .setAuthor(authorId)
        .setStatus('open');
      
      expect(result).toBe(builder);
      
      const helpPost = builder.build();
      expect(helpPost.title).toBe('Chained Title');
      expect(helpPost.description).toBe('Chained Description');
      expect(helpPost.category).toBe('Transport');
      expect(helpPost.location).toBe('Main Campus');
      expect(helpPost.neededBy).toBe(testDate);
      expect(helpPost.author).toBe(authorId);
      expect(helpPost.status).toBe('open');
    });
  });

  describe('addHelper', () => {
    it('should add helper with user and message', () => {
      const helper = {
        user: '507f1f77bcf86cd799439012',
        message: 'I can help with this!'
      };
      
      const result = builder.addHelper(helper);
      
      expect(result).toBe(builder);
      
      const helpPost = builder.build();
      expect(helpPost.helpers).toHaveLength(1);
      expect(helpPost.helpers[0].user).toBe(helper.user);
      expect(helpPost.helpers[0].message).toBe(helper.message);
      expect(helpPost.helpers[0].status).toBe('pending');
      expect(helpPost.helpers[0].offeredAt).toBeInstanceOf(Date);
    });

    it('should add helper with only user (empty message)', () => {
      const helper = {
        user: '507f1f77bcf86cd799439012'
      };
      
      builder.addHelper(helper);
      
      const helpPost = builder.build();
      expect(helpPost.helpers).toHaveLength(1);
      expect(helpPost.helpers[0].user).toBe(helper.user);
      expect(helpPost.helpers[0].message).toBe('');
      expect(helpPost.helpers[0].status).toBe('pending');
      expect(helpPost.helpers[0].offeredAt).toBeInstanceOf(Date);
    });

    it('should add multiple helpers', () => {
      const helper1 = {
        user: '507f1f77bcf86cd799439012',
        message: 'First helper'
      };
      const helper2 = {
        user: '507f1f77bcf86cd799439013',
        message: 'Second helper'
      };
      
      builder.addHelper(helper1).addHelper(helper2);
      
      const helpPost = builder.build();
      expect(helpPost.helpers).toHaveLength(2);
      expect(helpPost.helpers[0].user).toBe(helper1.user);
      expect(helpPost.helpers[0].message).toBe(helper1.message);
      expect(helpPost.helpers[1].user).toBe(helper2.user);
      expect(helpPost.helpers[1].message).toBe(helper2.message);
    });

    it('should set offeredAt timestamp for each helper', () => {
      const beforeTime = new Date();
      
      builder.addHelper({ user: '507f1f77bcf86cd799439012' });
      
      const afterTime = new Date();
      const helpPost = builder.build();
      
      expect(helpPost.helpers[0].offeredAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(helpPost.helpers[0].offeredAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('build', () => {
    it('should return the constructed helpPost object', () => {
      const testDate = new Date('2024-01-15');
      const authorId = '507f1f77bcf86cd799439011';
      const helper = {
        user: '507f1f77bcf86cd799439012',
        message: 'I can help!'
      };
      
      const helpPost = builder
        .setTitle('Complete Help Post')
        .setDescription('This is a complete help post')
        .setCategory('Study Help')
        .setLocation('Library')
        .setNeededBy(testDate)
        .setAuthor(authorId)
        .addHelper(helper)
        .setStatus('open')
        .build();
      
      expect(helpPost).toEqual({
        title: 'Complete Help Post',
        description: 'This is a complete help post',
        category: 'Study Help',
        location: 'Library',
        neededBy: testDate,
        author: authorId,
        helpers: [{
          user: helper.user,
          message: helper.message,
          offeredAt: expect.any(Date),
          status: 'pending'
        }],
        status: 'open'
      });
    });

    it('should return different objects on multiple builds', () => {
      builder.setTitle('Test Title');
      
      const helpPost1 = builder.build();
      const helpPost2 = builder.build();
      
      expect(helpPost1).toEqual(helpPost2);
      expect(helpPost1).not.toBe(helpPost2); // Different object references
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle empty string values', () => {
      const helpPost = builder
        .setTitle('')
        .setDescription('')
        .setCategory('')
        .setLocation('')
        .build();
      
      expect(helpPost.title).toBe('');
      expect(helpPost.description).toBe('');
      expect(helpPost.category).toBe('');
      expect(helpPost.location).toBe('');
    });

    it('should handle null values', () => {
      const helpPost = builder
        .setNeededBy(null)
        .setAuthor(null)
        .build();
      
      expect(helpPost.neededBy).toBeNull();
      expect(helpPost.author).toBeNull();
    });

    it('should maintain helpers array integrity', () => {
      const helper = { user: '507f1f77bcf86cd799439012' };
      
      builder.addHelper(helper);
      const helpPost1 = builder.build();
      
      builder.addHelper({ user: '507f1f77bcf86cd799439013' });
      const helpPost2 = builder.build();
      
      expect(helpPost1.helpers).toHaveLength(1);
      expect(helpPost2.helpers).toHaveLength(2);
    });
  });
});