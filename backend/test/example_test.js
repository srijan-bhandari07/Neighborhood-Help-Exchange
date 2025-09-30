const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const HelpPost = require('../models/HelpPost');
const sinon = require('sinon');
const { createHelpPost } = require('../controllers/helpPostController');

const { expect } = chai;



describe('Basic Mocha Test', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).to.equal(2);
  });
});


