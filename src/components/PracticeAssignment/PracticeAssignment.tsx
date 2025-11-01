import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, CheckCircle, XCircle, BookOpen, Plus, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import SpellingPreview from '../SpellingPreview/SpellingPreview';
import SpellingPractice from '../SpellingPractice/SpellingPractice';

interface User {
  id: string;
  username: string;
  role: string;
}

interface Practice {
  id: string;
  title: string;
  words: string[];
  created_at: string;
}

interface PracticeAssignmentProps {
  practice: Practice;
  onBack: () => void;
}

export const PracticeAssignment: React.FC<PracticeAssignmentProps> = ({ practice, onBack }) => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<'assign' | 'preview' | 'practice'>('assign');

  useEffect(() => {
    if (isAdmin) {
      fetchUsersAndAssignments();
    } else {
      setView('preview');
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchUsersAndAssignments = async () => {
    try {
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/list-users`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUserId: currentUser?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const nonAdminUsers = (data.users || []).filter((u: User) => u.role !== 'admin');
      setUsers(nonAdminUsers);

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('practice_assignments')
        .select('user_id')
        .eq('practice_id', practice.id);

      if (assignmentsError) throw assignmentsError;

      const assignedUserIds = new Set(assignmentsData?.map((a) => a.user_id) || []);
      setAssignments(assignedUserIds);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users and assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = async (userId: string) => {
    try {
      setError(null);
      setSuccess(null);

      const isAssigned = assignments.has(userId);

      if (isAssigned) {
        const { error: deleteError } = await supabase
          .from('practice_assignments')
          .delete()
          .eq('practice_id', practice.id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        const newAssignments = new Set(assignments);
        newAssignments.delete(userId);
        setAssignments(newAssignments);
        setSuccess('Assignment removed successfully');
      } else {
        const { error: insertError } = await supabase
          .from('practice_assignments')
          .insert({
            practice_id: practice.id,
            user_id: userId,
          });

        if (insertError) throw insertError;

        const newAssignments = new Set(assignments);
        newAssignments.add(userId);
        setAssignments(newAssignments);
        setSuccess('Practice assigned successfully');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling assignment:', err);
      setError('Failed to update assignment');
    }
  };

  if (view === 'preview') {
    return (
      <SpellingPreview
        title={practice.title}
        words={practice.words}
        onNext={() => setView('practice')}
        onBack={() => isAdmin ? setView('assign') : onBack()}
      />
    );
  }

  if (view === 'practice') {
    return (
      <SpellingPractice
        title={practice.title}
        words={practice.words}
        onBack={onBack}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <p className="text-center text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8" style={{ fontFamily: 'Times New Roman, serif' }}>
      <div className="max-w-4xl mx-auto">
        <div className="fixed top-4 left-0 right-0 z-40 flex justify-center gap-4 px-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-lg"
          >
            <Plus size={20} />
            <span>Create New Practice</span>
          </button>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg"
          >
            <BookOpen size={20} />
            <span>Saved Practices</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8" style={{ marginTop: '80px' }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{practice.title}</h1>
            <p className="text-gray-600">{practice.words.length} words</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={() => setView('preview')}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Play size={20} />
              <span>Preview Practice</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Users size={24} />
              <span>Assign to Students</span>
            </h2>

            {users.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No students found. Create student accounts first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isAssigned = assignments.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isAssigned
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isAssigned ? (
                          <CheckCircle size={24} className="text-green-600" />
                        ) : (
                          <XCircle size={24} className="text-gray-400" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{user.username}</p>
                          <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAssignment(user.id)}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          isAssigned
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isAssigned ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-start items-center pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Practices</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeAssignment;
