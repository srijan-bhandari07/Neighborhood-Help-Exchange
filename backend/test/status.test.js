const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const HelpPost = require('../models/HelpPost');
const sinon = require('sinon');
const { acceptHelpOffer, offerHelp, rejectHelpOffer, updateHelpPostStatus } = require('../controllers/helpPostController');
const HelpPostRepository = require('../repositories/HelpPostRepository');
const ConversationRepository = require('../repositories/ConversationRepository')

const { expect } = chai;

describe('Create Helper Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { message: 'I can help you' },
      user: { _id: new mongoose.Types.ObjectId() },
      app: { get: sandbox.stub().returns(null) }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should add helper and return updated post', async () => {
    const fakePost = {
      _id: req.params.id,
      author: new mongoose.Types.ObjectId(),
      helpers: [],
    };

    const updatedPost = { ...fakePost, helpers: [{ user: req.user._id, message: 'I can help you' }] };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);
    sandbox.stub(HelpPostRepository.prototype, 'addHelper').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'findByIdAndPopulate').resolves(updatedPost);

    await offerHelp(req, res);

    expect(res.json.calledWith(updatedPost)).to.be.true;
    expect(res.status.called).to.be.false; // no error status
  });

  it('should return 404 if help post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await offerHelp(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 400 if user tries to help their own post', async () => {
    const fakePost = {
      _id: req.params.id,
      author: req.user._id, // same user
      helpers: []
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);

    await offerHelp(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'You cannot offer help on your own post' })).to.be.true;
  });

  it('should return 400 if user already offered help', async () => {
    const fakePost = {
      _id: req.params.id,
      author: new mongoose.Types.ObjectId(),
      helpers: [{ user: req.user._id }]
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(fakePost);

    await offerHelp(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'You have already offered help for this post' })).to.be.true;
  });

  it('should return 500 if repository throws error', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await offerHelp(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});

describe('Update Accept Helper Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: {
        id: new mongoose.Types.ObjectId().toString(),
        helperId: new mongoose.Types.ObjectId().toString()
      },
      user: { _id: new mongoose.Types.ObjectId() }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should accept a help offer and return updated post', async () => {
    const helperId = req.params.helperId;
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      status: 'open',
      helpers: {
        id: (id) => id === helperId ? { _id: helperId, user: new mongoose.Types.ObjectId() } : null
      }
    };

    const updatedPost = { ...helpPost, status: 'in-progress' };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);
    sandbox.stub(HelpPostRepository.prototype, 'updateHelperStatus').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'update').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'findByIdAndPopulate').resolves(updatedPost);
    sandbox.stub(ConversationRepository.prototype, 'findOrCreateConversation').resolves();

    await acceptHelpOffer(req, res);

    expect(res.json.calledWith(updatedPost)).to.be.true;
    expect(res.status.called).to.be.false; // no error status
  });

  it('should return 404 if help post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await acceptHelpOffer(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 403 if user is not the author', async () => {
    const helpPost = {
      _id: req.params.id,
      author: new mongoose.Types.ObjectId(),
      helpers: { id: () => null }
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await acceptHelpOffer(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ message: 'Not authorized to accept help offers' })).to.be.true;
  });

  it('should return 404 if helper not found', async () => {
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      helpers: { id: () => null } // no helper
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await acceptHelpOffer(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Helper not found' })).to.be.true;
  });

  it('should return 500 if repository throws error', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await acceptHelpOffer(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });

  it('should still return updated post if conversation creation fails', async () => {
    const helperId = req.params.helperId;
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      status: 'open',
      helpers: {
        id: (id) => id === helperId ? { _id: helperId, user: new mongoose.Types.ObjectId() } : null
      }
    };

    const updatedPost = { ...helpPost, status: 'in-progress' };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);
    sandbox.stub(HelpPostRepository.prototype, 'updateHelperStatus').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'update').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'findByIdAndPopulate').resolves(updatedPost);
    sandbox.stub(ConversationRepository.prototype, 'findOrCreateConversation').throws(new Error('Conv error'));

    await acceptHelpOffer(req, res);

    expect(res.json.calledWith(updatedPost)).to.be.true;
  });
});


describe('Update Reject Helper Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: {
        id: new mongoose.Types.ObjectId().toString(),
        helperId: new mongoose.Types.ObjectId().toString()
      },
      user: { _id: new mongoose.Types.ObjectId() }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should reject a help offer and return updated post', async () => {
    const helpPost = {
      _id: req.params.id,
      author: req.user._id
    };

    const updatedPost = { ...helpPost, status: 'updated' };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);
    sandbox.stub(HelpPostRepository.prototype, 'updateHelperStatus').resolves();
    sandbox.stub(HelpPostRepository.prototype, 'findByIdAndPopulate').resolves(updatedPost);

    await rejectHelpOffer(req, res);

    expect(res.json.calledWith(updatedPost)).to.be.true;
    expect(res.status.called).to.be.false; // no error status
  });

  it('should return 404 if help post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await rejectHelpOffer(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 403 if user is not the author', async () => {
    const helpPost = {
      _id: req.params.id,
      author: new mongoose.Types.ObjectId() // different user
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await rejectHelpOffer(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ message: 'Not authorized to reject help offers' })).to.be.true;
  });

  it('should return 500 if repository throws error', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await rejectHelpOffer(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});


describe('Update HelpPost Status', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { status: 'in-progress' },
      user: { _id: new mongoose.Types.ObjectId() }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should update status successfully', async () => {
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      helpers: [{ status: 'accepted' }]
    };
    const updatedPost = { ...helpPost, status: 'in-progress' };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);
    sandbox.stub(HelpPostRepository.prototype, 'update').resolves(updatedPost);

    await updateHelpPostStatus(req, res);

    expect(res.json.calledWith(updatedPost)).to.be.true;
  });

  it('should return 404 if help post not found', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(null);

    await updateHelpPostStatus(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Help post not found' })).to.be.true;
  });

  it('should return 403 if user is not the author', async () => {
    const helpPost = {
      _id: req.params.id,
      author: new mongoose.Types.ObjectId(),
      helpers: []
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await updateHelpPostStatus(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ message: 'Not authorized to update this post' })).to.be.true;
  });

  it('should return 400 if status is completed but no accepted helpers', async () => {
    req.body.status = 'completed';
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      helpers: [{ status: 'pending' }]
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await updateHelpPostStatus(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'Cannot complete post without an accepted helper' })).to.be.true;
  });

  it('should return 400 if status is in-progress but no accepted helpers', async () => {
    req.body.status = 'in-progress';
    const helpPost = {
      _id: req.params.id,
      author: req.user._id,
      helpers: [{ status: 'pending' }]
    };

    sandbox.stub(HelpPostRepository.prototype, 'findById').resolves(helpPost);

    await updateHelpPostStatus(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'Cannot set to in-progress without accepting a helper' })).to.be.true;
  });

  it('should return 500 if repository throws error', async () => {
    sandbox.stub(HelpPostRepository.prototype, 'findById').throws(new Error('DB error'));

    await updateHelpPostStatus(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});
