import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Users, Plus, PlayCircle, UserPlus, XCircle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import SpellingTopNav from '../SpellingTopNav/SpellingTopNav';
import { supabase } from '../../lib/supabase'; // Import Supabase to fetch students

interface Practice {
  id: string;
  title: string;
  words: string[];
  created_at: string;
  assignment_count?: number;
  assignment_id?: string;
}

interface User {
  id: string;
  username: string;
  role: string;
  display_name?: string;
}

interface SavedPracticesProps {
  onCreateNew: () => void;
  onSelectPractice: (practice: Practice) => void;
  onPractice?: (practice: Practice) => void;
}

export const SavedPractices: React.FC<SavedPracticesProps> = ({ onCreateNew, onSelectPractice }) => {
  const { user } = useAuth();
  const { spellingLists, deleteSpellingList } = useAppContext();
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  
  // Student List State
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Load students when modal opens
  useEffect(() => {
    if (showAssignModal) {
      fetchStudents();
    }
  }, [showAssignModal]);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      // Fetch all users with role 'user' (students)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, display_name')
        .eq('role', 'user')
        .order('username');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteSpellingList(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const openAssignModal = (practice: Practice) => {
    setSelectedPractice(practice);
    setSelectedStudentIds(new Set()); // Reset selections
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedPractice(null);
    setSelectedStudentIds(new Set());
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudentIds(newSelection);
  };

  const applyAssignments = async () => {
    if (!selectedPractice || !user) return;
    
    setAssigning(true);
    try {
      // Create assignment records for selected students
      const assignmentsToInsert = Array.from(selectedStudentIds).map(studentId => ({
        practice_id: selectedPractice.id,
        user_id: studentId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }));

      if (assignmentsToInsert.length > 0) {
        const { error } = await supabase
          .from('practice_assignments')
          .insert(assignmentsToInsert);

        if (error) throw error;
        alert(`Successfully assigned to ${assignmentsToInsert.length} students!`);
      }
      
      closeAssignModal();
    } catch (error) {
      console.error('Error assigning practice:', error);
      alert('Failed to save assignments. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(assignSearch.toLowerCase()) ||
    (student.display_name && student.display_name.toLowerCase().includes(assignSearch.toLowerCase()))
  );

  return (
    <>
      <SpellingTopNav onCreateNew={onCreateNew} onViewSaved={() => {}} currentView="saved" />
      
      <div className="pt-24 px-8 pb-12" style={{ fontFamily: 'Times New Roman, serif' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <BookOpen className="text-blue-600" size={32} />
                Spelling Practices
              </h2>
              <p className="text-gray-600 mt-2">Manage and assign your spelling lists</p>
            </div>
          </div>

          {!spellingLists || spellingLists.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No practices yet</h3>
              <p className="text-gray-500 mb-6">Create your first spelling list to get started</p>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Create Practice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spellingLists.map((practice: any) => (
                <div 
                  key={practice.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-1 truncate" title={practice.title}>
                          {practice.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(practice.createdAt || practice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* DELETE BUTTON (Top Right) */}
                      <button
                        onClick={() => handleDelete(practice.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleteConfirm === practice.id
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {(practice.words || []).slice(0, 5).map((word: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md"
                          >
                            {word}
                          </span>
                        ))}
                        {(practice.words || []).length > 5 && (
                          <span className="px-2 py-1 text-gray-400 text-sm">
                            +{(practice.words || []).length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION ROW */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openAssignModal(practice)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                      <UserPlus size={18} />
                      <span>Assign</span>
                    </button>
                    
                    <button
                      onClick={() => onSelectPractice(practice)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      <PlayCircle size={18} />
                      <span>Practice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assign Modal (Fixed with Student List) */}
          {showAssignModal && selectedPractice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Assign Practice</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedPractice.title} • {selectedPractice.words.length} words
                    </p>
                  </div>
                  <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* STUDENT LIST */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                  {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-full py-8">
                      <div className="text-gray-500">Loading students...</div>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No students found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredStudents.map(student => (
                        <div 
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedStudentIds.has(student.id) 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selectedStudentIds.has(student.id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {selectedStudentIds.has(student.id) && <CheckCircle size={14} />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {student.display_name || student.username}
                              </p>
                              {student.display_name && (
                                <p className="text-xs text-gray-500">@{student.username}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl">
                  <div className="text-sm text-gray-600">
                    {selectedStudentIds.size} selected
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeAssignModal}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyAssignments}
                      disabled={assigning || selectedStudentIds.size === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigning ? 'Saving...' : 'Save Assignments'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedPractices;