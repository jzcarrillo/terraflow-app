'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ROLES, hasRole } from '../../utils/roleUtils';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:30081/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data);
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:30081/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        await fetchUsers();
        alert('User role updated successfully!');
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    } finally {
      setUpdating(null);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Admin privileges required.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full table-fixed border-collapse">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="w-16 px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-500">ID</th>
                  <th className="w-48 px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-500">Full Name</th>
                  <th className="w-32 px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-500">Username</th>
                  <th className="w-64 px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-500">Email Address</th>
                  <th className="w-32 px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-500">Current Role</th>
                  <th className="w-24 px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-500">Status</th>
                  <th className="w-40 px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {users.length === 0 ? (
                  <tr className="border-b border-gray-200">
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Register some users first to manage their roles</p>
                      </div>
                    </td>
                  </tr>
                ) : users.map((user, index) => (
                  <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 text-center">
                      #{user.id}
                    </td>
                    <td className="px-4 py-4 border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                            {user.first_name?.charAt(0) || 'U'}{user.last_name?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name || 'Unknown'} {user.last_name || 'User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 font-mono truncate">
                      {user.username}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 truncate">
                      {user.email_address}
                    </td>
                    <td className="px-4 py-4 border-r border-gray-200 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800 border border-red-200' :
                        user.role === 'CASHIER' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        user.role === 'LAND_TITLE_PROCESSOR' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {user.role || 'ADMIN'}
                      </span>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-200 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select
                        value={user.role || 'ADMIN'}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="CASHIER">CASHIER</option>
                        <option value="LAND_TITLE_PROCESSOR">PROCESSOR</option>
                      </select>
                      {updating === user.id && (
                        <div className="mt-1 flex justify-center">
                          <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}