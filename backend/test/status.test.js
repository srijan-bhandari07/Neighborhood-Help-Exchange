const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const User = require('../models/User');
const sinon = require('sinon');
const { register , getUserHelpPosts, updateHelpPost, deleteHelpPost } = require('../controllers/authController');
const UserRepository = require('../repositories/UserRepository');

const { expect } = chai;



