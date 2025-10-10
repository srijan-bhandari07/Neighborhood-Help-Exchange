const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const sinon = require('sinon');
const { getConversation, sendMessage, markAsRead  } = require('../controllers/messageController');
const MessageRepository = require('../repositories/MessageRepository');
const ConversationRepository = require('../repositories/ConversationRepository');

const { expect } = chai;

describe('Create Message Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { conversationId: new mongoose.Types.ObjectId().toString() },
      user: { _id: new mongoose.Types.ObjectId() },
      body: { content: 'Hello world' }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };


  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should create a message successfully', async () => {
    const fakeConversation = { _id: req.params.conversationId };
    const fakeMessage = {
      _id: new mongoose.Types.ObjectId(),
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: req.body.content
    };

    sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves(fakeConversation);
    const msgStub = sandbox.stub(MessageRepository.prototype, 'createMessage').resolves(fakeMessage);
    const updateStub = sandbox.stub(ConversationRepository.prototype, 'updateLastMessage').resolves();

    await sendMessage(req, res);

    expect(msgStub.calledOnceWith({
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: req.body.content
    })).to.be.true;

    expect(updateStub.calledOnceWith(req.params.conversationId, fakeMessage._id)).to.be.true;

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(fakeMessage)).to.be.true;
  });

  it('should return 404 if conversation not found', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves(null);

    await sendMessage(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Conversation not found' })).to.be.true;
  });

  it('should return 500 if repository throws', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').throws(new Error('DB Error'));

    await sendMessage(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});





describe('Get Message Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { conversationId: new mongoose.Types.ObjectId().toString() },
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

  it('should get a conversation with messages if found', async () => {
    const fakeConversation = { _id: req.params.conversationId, participants: [req.user._id] };
    const fakeMessages = [
      { _id: new mongoose.Types.ObjectId(), content: 'Hello', sender: req.user._id },
      { _id: new mongoose.Types.ObjectId(), content: 'Hi', sender: req.user._id }
    ];

    const convoStub = sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves(fakeConversation);
    const msgStub = sandbox.stub(MessageRepository.prototype, 'getConversationMessages').resolves(fakeMessages);

    await getConversation(req, res);

    expect(convoStub.calledOnceWith(req.params.conversationId, req.user._id)).to.be.true;
    expect(msgStub.calledOnceWith(req.params.conversationId)).to.be.true;

    expect(res.json.calledWith({
      conversation: fakeConversation,
      messages: fakeMessages
    })).to.be.true;
    expect(res.status.called).to.be.false; // No error status
  });

  it('should return 404 if conversation not found', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves(null);

    await getConversation(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Conversation not found' })).to.be.true;
  });

  it('should return 500 if repository throws', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').throws(new Error('DB Error'));

    await getConversation(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});


describe('Update Message Test', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { conversationId: new mongoose.Types.ObjectId().toString() },
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

    it('should mark messages as read and return success', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves({ _id: req.params.conversationId });
    const markStub = sandbox.stub(MessageRepository.prototype, 'markMessagesAsRead').resolves();

    await markAsRead(req, res);

    expect(markStub.calledOnceWith(req.params.conversationId, req.user._id)).to.be.true;
    expect(res.json.calledWith({ message: 'Messages marked as read' })).to.be.true;
    expect(res.status.called).to.be.false; // no error status set
  });

  it('should return 404 if conversation not found', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').resolves(null);

    await markAsRead(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Conversation not found' })).to.be.true;
  });

  it('should return 500 if repository throws', async () => {
    sandbox.stub(ConversationRepository.prototype, 'findConversation').throws(new Error('DB Error'));

    await markAsRead(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Server error' })).to.be.true;
  });
});
