import React, { useState } from 'react';
import HelpPostList from '../components/HelpPostList';
import HelpPostForm from '../components/HelpPostForm';
import TaskList from '../components/TaskList';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('all-posts');

  const tabs = [
    { id: 'all-posts', label: 'All Help Requests', component: <HelpPostList /> },
    { id: 'my-posts', label: 'My Posts', component: <TaskList /> },
    { id: 'create-post', label: 'Create Request', component: <HelpPostForm /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Community Help Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with your community to give and receive help with everyday tasks
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 rounded-xl bg-blue-100 p-1 max-w-md mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-600 hover:bg-white/[0.3]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
};

export default HomePage;