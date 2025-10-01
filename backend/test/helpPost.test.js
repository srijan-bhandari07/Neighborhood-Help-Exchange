const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const HelpPost = require('../models/HelpPost');
const sinon = require('sinon');
const { createHelpPost, getUserHelpPosts, getAllHelpPosts, updateHelpPost, deleteHelpPost } = require('../controllers/helpPostController');
const HelpPostRepository = require('../repositories/HelpPostRepository');


const { expect } = chai;

//Silence all console errors during test runs, turn on console.logs after test runs
beforeEach(() => {
  sinon.stub(console, 'error'); // silence console.error
});
afterEach(() => {
  sinon.restore();
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

    const req = {
      user: {_id: fakeHelpPost.author},
      body: {}
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    const repositoryStub = sinon.stub(HelpPostRepository.prototype, 'getUserHelpPosts').resolves(fakeHelpPost)

    await getUserHelpPosts(req, res)

    expect(repositoryStub.calledOnce).to.be.true;
    expect(repositoryStub.calledWith(req.user._id)).to.be.true;

    repositoryStub.restore();
  });

  it('should return 500 if repository throws an error', async () => {
    sinon.stub(
      HelpPostRepository.prototype,
      'getUserHelpPosts'
    ).throws(new Error('DB Error'));

    const req = {
      user: {_id: new mongoose.Types.ObjectId() },
      body: {}
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await getUserHelpPosts(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});

describe('Get All HelpPost Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      query: {}
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return 200 and all help posts (no filters)', async () => {
    const fakePosts = [{ title: 'Post 1' }, { title: 'Post 2' }];

    sandbox.stub(HelpPostRepository.prototype, 'getHelpPostsWithFilters')
      .resolves(fakePosts);

    await getAllHelpPosts(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(fakePosts)).to.be.true;
  });

  it('should call repository with category and status filters', async () => {
    const fakePosts = [{ title: 'Filtered Post' }];

    req.query = { category: 'Shopping', status: 'Open', page: 2, limit: 5 };

    const repoStub = sandbox.stub(HelpPostRepository.prototype, 'getHelpPostsWithFilters')
      .resolves(fakePosts);

    await getAllHelpPosts(req, res);

    expect(repoStub.calledWith(
      { category: 'Shopping', status: 'Open' },
      2,
      5
    )).to.be.true;

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(fakePosts)).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'getHelpPostsWithFilters')
      .throws(new Error('DB error'));

    await getAllHelpPosts(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});

describe('Update HelpPost Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: {
        title: 'Updated Title',
        description: 'Updated Description',
        category: 'Shopping',
        location: 'Updated Location',
        neededBy: new Date()
      },
      user: { _id: new mongoose.Types.ObjectId() },
      app: { get: sandbox.stub().withArgs('io').returns({ emit: sandbox.spy() }) }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };

  });

  afterEach(() => {
    sandbox.restore();
  });


  it('should return 404 if post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await updateHelpPost(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 403 if user is not the author', async () => {
    const fakePost = { author: new mongoose.Types.ObjectId() }; // different author
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);

    await updateHelpPost(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Not authorized to update this post' })).to.be.true;
  });

  it('should update and return post if authorized', async () => {
    const fakePost = { author: req.user._id };
    const updatedPost = { ...fakePost, title: 'Updated Title' };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);
    const updateStub = sandbox.stub(HelpPostRepository.prototype, 'update').resolves(updatedPost);

    await updateHelpPost(req, res);

    expect(updateStub.calledOnceWith(req.params.id, sinon.match.object)).to.be.true;
    expect(res.json.calledWith(updatedPost)).to.be.true;

    // socket emit check
    const io = req.app.get('io');
    expect(io.emit.calledWith('updated_help_post', updatedPost)).to.be.true;
  });

  it('should return 500 if repository throws', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await updateHelpPost(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});

describe('Delete HelpPost Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { _id: new mongoose.Types.ObjectId() },
      app: { get: sandbox.stub().withArgs('io').returns({ emit: sandbox.spy() }) }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return 404 if post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await deleteHelpPost(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 403 if user is not the author', async () => {
    const fakePost = { author: new mongoose.Types.ObjectId() }; // different author
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);

    await deleteHelpPost(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Not authorized to delete this post' })).to.be.true;
  });

  it('should delete post and return success if authorized', async () => {
    const fakePost = { author: req.user._id };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);
    const deleteStub = sandbox.stub(HelpPostRepository.prototype, 'delete').resolves();

    await deleteHelpPost(req, res);

    expect(deleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Help post deleted successfully' })).to.be.true;

    // socket emit check
    const io = req.app.get('io');
    expect(io.emit.calledWith('deleted_help_post', req.params.id)).to.be.true;
  });

  it('should return 500 if repository throws', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await deleteHelpPost(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });

});










