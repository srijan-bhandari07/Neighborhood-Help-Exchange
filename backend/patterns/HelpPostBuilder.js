/**
 * HelpPostBuilder - Builder pattern implementation for creating HelpPost objects
 * Provides a fluent interface for constructing HelpPost objects with improved readability
 */
class HelpPostBuilder {
  /**
   * Initialize builder with default values matching HelpPost schema
   */
  constructor() {
    this.helpPost = {
      title: '',
      description: '',
      category: '',
      location: '',
      neededBy: null,
      author: null,
      helpers: [],
      status: 'open'
    };
  }

  /**
   * Set the title of the help post
   * @param {string} title - The title of the help post
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setTitle(title) {
    this.helpPost.title = title;
    return this;
  }

  /**
   * Set the description of the help post
   * @param {string} description - The description of the help post
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setDescription(description) {
    this.helpPost.description = description;
    return this;
  }

  /**
   * Set the category of the help post
   * @param {string} category - The category (Shopping, Transport, Study Help, etc.)
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setCategory(category) {
    this.helpPost.category = category;
    return this;
  }

  /**
   * Set the location of the help post
   * @param {string} location - The location where help is needed
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setLocation(location) {
    this.helpPost.location = location;
    return this;
  }

  /**
   * Set the date by which help is needed
   * @param {Date} neededBy - The date by which help is needed
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setNeededBy(neededBy) {
    this.helpPost.neededBy = neededBy;
    return this;
  }

  /**
   * Set the author of the help post
   * @param {string|ObjectId} author - The author's user ID
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setAuthor(author) {
    this.helpPost.author = author;
    return this;
  }

  /**
   * Add a helper to the help post
   * @param {Object} helper - Helper object with user and optional message
   * @param {string|ObjectId} helper.user - The helper's user ID
   * @param {string} [helper.message=''] - Optional message from the helper
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  addHelper(helper) {
    this.helpPost.helpers.push({
      user: helper.user,
      message: helper.message || '',
      offeredAt: new Date(),
      status: 'pending'
    });
    return this;
  }

  /**
   * Set the status of the help post
   * @param {string} status - The status (open, in-progress, completed)
   * @returns {HelpPostBuilder} Builder instance for method chaining
   */
  setStatus(status) {
    this.helpPost.status = status;
    return this;
  }

  /**
   * Build and return the constructed HelpPost object
   * @returns {Object} The constructed HelpPost object
   */
  build() {
    return this.helpPost;
  }
}

module.exports = HelpPostBuilder;