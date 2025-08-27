import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HelpPostCard from './HelpPostCard';
import { useParams } from 'react-router-dom';

const Profile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [offeredPosts, setOfferedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [userResponse, postsResponse, offersResponse] = await Promise.all([
          axios.get(`/api/users/${userId}`),
          axios.get(`/api/help?author=${userId}`),
          axios.get(`/api/help?helper=${userId}`)
        ]);

        setUser(userResponse.data);
        setUserPosts(postsResponse.data.helpPosts || []);
        setOfferedPosts(offersResponse.data.helpPosts || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleUpdateStatus = async (postId, status) => {
    try {
      const response = await axios.put(`/api/help/${postId}/status`, { status });
      setUserPosts(userPosts.map(post => 
        post._id === postId ? response.data : post
      ));
      setOfferedPosts(offeredPosts.map(post => 
        post._id === postId ? response.data : post
      ));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      console.error('Error updating status:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`/api/help/${postId}`);
      setUserPosts(userPosts.filter(post => post._id !== postId));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete post';
      console.error('Error deleting post:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleWithdrawOffer = async (postId) => {
    try {
      await axios.delete(`/api/help/${postId}/offer-help`);
      setOfferedPosts(offeredPosts.filter(post => post._id !== postId));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to withdraw offer';
      console.error('Error withdrawing offer:', error);
      return { success: false, message: errorMessage };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-gray-500">User not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={`${user.name}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex justify-center md:justify-start gap-4 mt-3">
              <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
                {userPosts.length} Requests
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full text-sm text-green-700">
                {offeredPosts.length} Offers
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full text-sm text-purple-700">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'offers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            My Offers
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'requests' ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Help Requests</h2>
          {userPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">You haven't created any help requests yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userPosts.map((post) => (
                <HelpPostCard
                  key={post._id}
                  post={post}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeletePost}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Help Offers</h2>
          {offeredPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">You haven't offered help to any requests yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offeredPosts.map((post) => (
                <HelpPostCard
                  key={post._id}
                  post={post}
                  onWithdrawOffer={handleWithdrawOffer}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;