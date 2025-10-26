'use client';

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { hasRole } from '@/utils/auth'
import { API_CONFIG, ROLES } from '@/utils/config'

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data);
        const sortedUsers = (data.users || []).sort((a, b) => a.id - b.id);
        setUsers(sortedUsers);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserDetails = async () => {
    setUpdating(editingUser.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchUsers();
        alert('User updated successfully!');
        setEditingUser(null);
        setEditForm({first_name: '', last_name: '', email_address: '', role: ''});
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    } finally {
      setUpdating(null);
    }
  };

  if (!hasRole(ROLES.ADMIN)) {
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
        <h1 className="text-3xl font-bold mb-10">User Management</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <table className="min-w-full" style={{borderCollapse: 'collapse', border: '1px solid #333', tableLayout: 'fixed'}}>
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '80px'}}>ID</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '200px'}}>Full Name</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '120px'}}>Username</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '250px'}}>Email Address</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '120px'}}>Role</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '80px'}}>Status</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wider" style={{border: '1px solid #333', width: '150px'}}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50" style={{border: '1px solid #333'}}>
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
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 text-center" style={{border: '1px solid #333'}}>
                      #{user.id}
                    </td>
                    <td className="px-4 py-4 text-center" style={{border: '1px solid #333'}}>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name || 'Unknown'} {user.last_name || 'User'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900 font-mono" style={{border: '1px solid #333'}}>
                      {user.username}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900" style={{border: '1px solid #333'}}>
                      {user.email_address}
                    </td>
                    <td className="px-4 py-4 text-center" style={{border: '1px solid #333'}}>
                      <div className="flex justify-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'CASHIER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'LAND_TITLE_PROCESSOR' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role || 'ADMIN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center" style={{border: '1px solid #333'}}>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center" style={{border: '1px solid #333'}}>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditForm({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email_address: user.email_address || '',
                            role: user.role || 'ADMIN'
                          });
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors text-xs"
                        title="Edit User"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}>
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 scale-100" style={{position: 'relative', zIndex: 1000, maxHeight: '90vh', overflow: 'auto', border: '1px solid #0b0c0cff', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'}}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Edit User Details</h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{minWidth: '180px', fontSize: '16px', fontWeight: '500'}}>First Name:</div>
                    <div style={{flex: 1}}>
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                        style={{width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px'}}
                      />
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{minWidth: '180px', fontSize: '16px', fontWeight: '500'}}>Last Name:</div>
                    <div style={{flex: 1}}>
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                        style={{width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px'}}
                      />
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{minWidth: '180px', fontSize: '16px', fontWeight: '500'}}>Email Address:</div>
                    <div style={{flex: 1}}>
                      <input
                        type="email"
                        value={editForm.email_address}
                        onChange={(e) => setEditForm({...editForm, email_address: e.target.value})}
                        style={{width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px'}}
                      />
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{minWidth: '180px', fontSize: '16px', fontWeight: '500'}}>Role:</div>
                    <div style={{flex: 1}}>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        style={{width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px'}}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="CASHIER">CASHIER</option>
                        <option value="LAND_TITLE_PROCESSOR">LAND TITLE PROCESSOR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button onClick={() => {setEditingUser(null); setEditForm({first_name: '', last_name: '', email_address: '', role: ''});}}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancel
                </button>
                <button
                  onClick={() => updateUserDetails()}
                  disabled={updating === editingUser.id}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {updating === editingUser.id ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}