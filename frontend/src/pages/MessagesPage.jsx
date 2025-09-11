import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';

const MessagesPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Communicate with other community members about help requests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <ConversationList />
        </div>

        {/* Message List */}
        <div className="lg:col-span-2">
          <Routes>
            <Route path="/:conversationId" element={<MessageList />} />
            <Route path="/" element={
              <div className="bg-white rounded-lg shadow-sm border h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;