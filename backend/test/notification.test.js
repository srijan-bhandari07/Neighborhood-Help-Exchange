const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const sinon = require('sinon');
const NotificationController = require('../controllers/notificationController');
const { expect } = chai;

describe('Get Notification Test', () => {
  let notificationController;
  let req, res, stub;

  beforeEach(() => {
    // Create fresh controller instance for each test
    notificationController = new NotificationController();

    // Mock req and res
    req = {
      query: { page: '2', limit: '5' },
      user: { _id: 'user123' }
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Stub the repository method
    stub = sinon.stub(notificationController.notificationRepository, 'getUserNotifications');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should get user notifications', async () => {
    const fakeResult = [{ id: 1, title: 'Test Notification' }];
    stub.resolves(fakeResult);

    await notificationController.getUserNotifications(req, res);

    expect(stub.calledOnceWith('user123', 5, 2)).to.be.true;
    expect(res.json.calledOnceWith({
      success: true,
      data: fakeResult
    })).to.be.true;
  });


  it('should return 500 if repository throws error', async () => {
    stub.rejects(new Error('DB error'));

    await notificationController.getUserNotifications(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while fetching notifications'
    })).to.be.true;
  });

});

describe('Get UnreadCount Notification Test', () => {
  let notificationController;
  let req, res, stub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      user: { _id: 'user123' }
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    stub = sinon.stub(notificationController.notificationRepository, 'getUnreadCount');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return unread count successfully', async () => {
    stub.resolves(7);

    await notificationController.getUnreadCount(req, res);

    expect(stub.calledOnceWith('user123')).to.be.true;
    expect(res.json.calledOnceWith({
      success: true,
      data: { count: 7 }
    })).to.be.true;
  });

  it('should return 500 if repository throws error', async () => {
    stub.rejects(new Error('DB error'));

    await notificationController.getUnreadCount(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while fetching unread count'
    })).to.be.true;
  });
});

describe('Update markAsRead Notification Test', () => {
  let req, res, sandbox, controller;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { _id: new mongoose.Types.ObjectId() }
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.spy()
    };

    // Create controller with stubbed repo
    controller = new NotificationController();
    controller.notificationRepository = {
      findById: sandbox.stub(),
      markAsRead: sandbox.stub()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should mark a notification as read successfully', async () => {
    const notification = {
      _id: req.params.id,
      recipient: req.user._id
    };
    const updatedNotification = { ...notification, read: true };

    controller.notificationRepository.findById.resolves(notification);
    controller.notificationRepository.markAsRead.resolves(updatedNotification);

    await controller.markAsRead(req, res);

    expect(res.json.calledWith({
      success: true,
      data: updatedNotification
    })).to.be.true;
  });

  it('should return 404 if notification not found', async () => {
    controller.notificationRepository.findById.resolves(null);

    await controller.markAsRead(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({
      success: false,
      message: 'Notification not found'
    })).to.be.true;
  });

  it('should return 403 if notification belongs to another user', async () => {
    const notification = {
      _id: req.params.id,
      recipient: new mongoose.Types.ObjectId() // different user
    };

    controller.notificationRepository.findById.resolves(notification);

    await controller.markAsRead(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({
      success: false,
      message: 'Unauthorized to modify this notification'
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    controller.notificationRepository.findById.throws(new Error('DB error'));

    await controller.markAsRead(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({
      success: false,
      message: 'Server error while marking notification as read'
    })).to.be.true;
  });
});


describe('Update markAllAsRead Notification Test', () => {
  let notificationController;
  let req, res, stub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      user: { _id: 'user123' }
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    stub = sinon.stub(notificationController.notificationRepository, 'markAllAsRead');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should mark all notifications as read successfully', async () => {
    stub.resolves({ modifiedCount: 5 });

    await notificationController.markAllAsRead(req, res);

    expect(stub.calledOnceWith('user123')).to.be.true;
    expect(res.json.calledOnceWith({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: 5 }
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    stub.rejects(new Error('DB error'));

    await notificationController.markAllAsRead(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while marking all notifications as read'
    })).to.be.true;
  });
});


describe('Delete Notification Test', () => {
  let notificationController;
  let req, res, findStub, deleteStub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      params: { id: 'notif123' },
      user: { _id: 'user123' }
    };

    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    findStub = sinon.stub(notificationController.notificationRepository, 'findById');
    deleteStub = sinon.stub(notificationController.notificationRepository, 'delete');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should delete a notification successfully', async () => {
    const mockNotification = { _id: 'notif123', recipient: 'user123' };
    findStub.resolves(mockNotification);
    deleteStub.resolves();

    await notificationController.deleteNotification(req, res);

    expect(findStub.calledOnceWith('notif123')).to.be.true;
    expect(deleteStub.calledOnceWith('notif123')).to.be.true;
    expect(res.json.calledOnceWith({
      success: true,
      message: 'Notification deleted successfully'
    })).to.be.true;
  });

  it('should return 404 if notification is not found', async () => {
    findStub.resolves(null);

    await notificationController.deleteNotification(req, res);

    expect(res.status.calledOnceWith(404)).to.be.true;
    expect(res.json.calledOnceWith({
      success: false,
      message: 'Notification not found'
    })).to.be.true;
  });

  it('should return 403 if user is not the recipient', async () => {
    const mockNotification = { _id: 'notif123', recipient: 'anotherUser' };
    findStub.resolves(mockNotification);

    await notificationController.deleteNotification(req, res);

    expect(res.status.calledOnceWith(403)).to.be.true;
    expect(res.json.calledOnceWith({
      success: false,
      message: 'Unauthorized to delete this notification'
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    findStub.rejects(new Error('DB error'));

    await notificationController.deleteNotification(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while deleting notification'
    })).to.be.true;
  });
});


describe('Delete all Notifications Test', () => {
  let notificationController;
  let req, res, deleteManyStub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      user: { _id: 'user123' }
    };

    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    deleteManyStub = sinon.stub(notificationController.notificationRepository, 'deleteMany');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should clear all notifications for the user and return deleted count', async () => {
    const mockResult = { deletedCount: 3 };
    deleteManyStub.resolves(mockResult);

    await notificationController.clearAllNotifications(req, res);

    expect(deleteManyStub.calledOnceWith({ recipient: 'user123' })).to.be.true;

    expect(res.json.calledOnceWith({
      success: true,
      message: 'All notifications cleared',
      data: { deletedCount: 3 }
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    deleteManyStub.rejects(new Error('DB error'));

    await notificationController.clearAllNotifications(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while clearing notifications'
    })).to.be.true;
  });
});

describe('Get NotificationByType Test', () => {
  let notificationController;
  let req, res, getStub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      params: { type: 'help_post_created' },
      query: { page: '2', limit: '5' },
      user: { _id: 'user123' }
    };

    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    getStub = sinon.stub(notificationController.notificationRepository, 'getUserNotifications');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return notifications filtered by type', async () => {
    const mockResult = [{ id: 1, type: 'help_post_created' }];
    getStub.resolves(mockResult);

    await notificationController.getNotificationsByType(req, res);

    expect(getStub.calledOnceWith(
      'user123', 
      5, // parsed limit
      2, // parsed page
      { type: 'help_post_created' }
    )).to.be.true;

    expect(res.json.calledOnceWith({
      success: true,
      data: mockResult
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    getStub.rejects(new Error('DB error'));

    await notificationController.getNotificationsByType(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledOnceWithMatch({
      success: false,
      message: 'Server error while fetching notifications by type'
    })).to.be.true;
  });
});


describe('Get Recent Notification Test', () => {
  let notificationController;
  let req, res, getUserNotificationsStub;

  beforeEach(() => {
    notificationController = new NotificationController();

    req = {
      user: { _id: 'user123' }
    };

    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    getUserNotificationsStub = sinon.stub(
      notificationController.notificationRepository,
      'getUserNotifications'
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return the 10 most recent notifications', async () => {
    const mockNotifications = [
      { id: 1, message: 'Test 1' },
      { id: 2, message: 'Test 2' }
    ];
    getUserNotificationsStub.resolves(mockNotifications);

    await notificationController.getRecentNotifications(req, res);

    expect(
      getUserNotificationsStub.calledOnceWith('user123', 10, 1)
    ).to.be.true;

    expect(res.json.calledOnceWith({
      success: true,
      data: mockNotifications
    })).to.be.true;
  });

  it('should return 500 if repository throws an error', async () => {
    getUserNotificationsStub.rejects(new Error('DB error'));

    await notificationController.getRecentNotifications(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(
      res.json.calledOnceWithMatch({
        success: false,
        message: 'Server error while fetching recent notifications'
      })
    ).to.be.true;
  });
});