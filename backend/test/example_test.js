const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const HelpPost = require('../models/HelpPost');
const sinon = require('sinon');
const { createHelpPost, getAllHelpPosts } = require('../controllers/helpPostController');
const HelpPostRepository = require('../repositories/HelpPostRepository');


const { expect } = chai;



//Silence all console errors during test runs, turn on console.logs after test runs
beforeEach(() => {
  sinon.stub(console, 'error'); // silence console.error
});
afterEach(() => {
  sinon.restore();
});


describe('Basic Mocha Test', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).to.equal(2);
  });
});


describe('Create HelpPost Test', () => {
  it('should create a new HelpPost successfully', async () => {
    const userId = new mongoose.Types.ObjectId();
    const helpPostData = {
      title: 'Need help with groceries',
      description: 'Looking for someone to help carry groceries',
      category: 'Shopping',
      location: 'Campus Store',
      neededBy: '2025-12-31',
      author: userId
    };

    // Stub HelpPostRepository methods
    const fakeHelpPost = {
      _id: new mongoose.Types.ObjectId(),
      ...helpPostData,
      populate: sinon.stub().resolvesThis()
    };

    const createStub = sinon.stub(HelpPostRepository.prototype, 'create').resolves(fakeHelpPost);
    const findByIdAndPopulateStub = sinon.stub(HelpPostRepository.prototype, 'findByIdAndPopulate').resolves(fakeHelpPost);

    // Mock req and res
    const req = {
      body: helpPostData,
      user: { _id: userId },
      app: { get: () => ({ emit: sinon.spy() }) }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await createHelpPost(req, res);

    expect(createStub.calledOnce).to.be.true;
    expect(findByIdAndPopulateStub.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(fakeHelpPost)).to.be.true;

    createStub.restore();

  });

  it('should return 500 if a server error occurs', async () => {
    const userId = new mongoose.Types.ObjectId();
    const helpPostData = {
      title: 'Broken Post',
      description: 'This will fail',
      category: 'Shopping',
      location: 'Campus',
      neededBy: '2025-12-31',
      author: userId
    };

    // Force validationResult to succeed
    const expressValidator = require('express-validator');
    expressValidator.validationResult = () => ({
      isEmpty: () => true,
      array: () => []
    });

    // Stub HelpPostRepository.create to throw error
    sinon.stub(HelpPostRepository.prototype, 'create').throws(new Error('DB Error'));

    const req = {
      body: helpPostData,
      user: { _id: userId },
      app: { get: () => null } // no socket.io
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await createHelpPost(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;

    sinon.restore();
  });

});

describe('Get HelpPost Test', () => {
  it('should return HelpPost for the given user', async () => {
    const userId = new mongoose.Types.ObjectId();

    // Mock task data
    const fakeHelpPost = [
      { title: "HelpPost 1", description: 'Description 1', category: 'Shopping',
        location: 'Location 1', neededBy: '2025-12-31', author: userId },
      { title: "HelpPost 2", description: 'Description 2', category: 'Shopping',
        location: 'Location 2', neededBy: '2025-12-31', author: userId },
    ];
    
    const getStub = sinon.stub();
    
    
    
    const req = {
      user: {_id: new mongoose.Types.ObjectId()},
      body: {}
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    const getHelpPostSnub = sinon.stub(HelpPost, 'find').resolves(tasks);
    const helpPosts = await helpPostRepository.getUserHelpPosts(req.user._id);


    //Stub helpPostRepository.getHelpPostsWithFilters to get result
    const getHelpPostsStub = sinon.stub(HelpPostRepository.prototype, 'getHelpPostsWithFilters').resolves(filter, req.page, req.limit);

    

    await getAllHelpPosts(req, res)

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(result))
  });
});


describe('Update HelpPost Test', () => {
  it('should update HelpPost successfully', async () => {

  });

});




describe('Delete HelpPost Test', () => {
  it('should delete HelpPost successfully', async () => {

  });

});










