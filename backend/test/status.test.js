const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const HelpPost = require('../models/HelpPost');
const sinon = require('sinon');
const { createHelpPost, getUserHelpPosts, updateHelpPost, deleteHelpPost } = require('../controllers/helpPostController');
const HelpPostRepository = require('../repositories/HelpPostRepository');

const { expect } = chai;

