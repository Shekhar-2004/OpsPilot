import React, { useState, useEffect } from 'react';
import { teamService, taskService } from '../services/api';
import StatusBadge from '../components/badges/StatusBadge';
import { Plus, Users, ArrowRight, UserPlus, Trash2, Clock } from 'lucide-react';

export default function TeamWorkspace({ user }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Modals / Form states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // New task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskOwner, setTaskOwner] = useState('');
  
  // New member fields
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const allTeams = await teamService.list();
      setTeams(allTeams);
      if (allTeams.length > 0) {
        setSelectedTeam(allTeams[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      setLoading(true);
      const teamDetail = await teamService.get(teamId);
      setMembers(teamDetail.members || []);
      
      const teamTasks = await taskService.list({ team_id: teamId });
      setTasks(teamTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const newTask = await taskService.create({
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: 'todo',
        deadline: taskDeadline,
        team_id: selectedTeam.id,
        owner_id: taskOwner ? parseInt(taskOwner) : null
      });

      setTasks([...tasks, newTask]);
      setShowTaskModal(false);
      
      // Reset form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('medium');
      setTaskDeadline('');
      setTaskOwner('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const updatedTeam = await teamService.addMember(selectedTeam.id, newMemberEmail);
      setMembers(updatedTeam.members || []);
      setShowMemberModal(false);
      setNewMemberEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member. Make sure they registered first.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updatedTasks);
      
      await taskService.update(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
      fetchTeamDetails(selectedTeam.id);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      setTasks(tasks.filter(t => t.id !== taskId));
      await taskService.delete(taskId);
    } catch (err) {
      console.error(err);
      fetchTeamDetails(selectedTeam.id);
    }
  };

  if (teams.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto space-y-4">
        <Users className="w-16 h-16 text-on-surface-variant/60" />
        <h3 className="text-xl font-display text-primary">No Workspaces Found</h3>
        <p className="text-on-surface-variant text-sm">
          You are not currently assigned to any operational teams. If you are an Admin or Coordinator, you can initialize a new team workspace below.
        </p>
        {['admin', 'coordinator'].includes(user.role) && (
          <button
            onClick={async () => {
              const name = prompt("Enter team workspace name (e.g. hackathon-design):");
              if (name) {
                try {
                  const newT = await teamService.create(name, "Operational workgroup");
                  setTeams([newT]);
                  setSelectedTeam(newT);
                } catch (err) {
                  alert(err.response?.data?.detail || "Error creating team");
                }
              }
            }}
            className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-on-primary font-semibold text-sm transition-all cursor-pointer"
          >
            Create First Workspace
          </button>
        )}
      </div>
    );
  }

  const getColTasks = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      
      {/* Workspace Selector Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container border border-outline-variant/30 p-4 rounded-xxl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/10 border border-secondary/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">Operational Workspace</span>
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === parseInt(e.target.value));
                if (team) setSelectedTeam(team);
              }}
              className="bg-transparent border-0 text-2xl font-display font-bold text-primary focus:ring-0 cursor-pointer pr-8 pl-0 py-0 appearance-none outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-bg text-primary font-semibold text-sm">{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemberModal(true)}
            className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-sm text-primary font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-on-surface-variant" />
            Members ({members.length})
          </button>
          
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-sm text-on-primary font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Kanban Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { id: 'todo', title: 'To Do', color: 'border-t-outline-variant bg-surface-container-low/40' },
            { id: 'in_progress', title: 'In Progress', color: 'border-t-secondary bg-surface-container-low' },
            { id: 'blocked', title: 'Blocked', color: 'border-t-error bg-error-container/10' },
            { id: 'done', title: 'Completed', color: 'border-t-tertiary-fixed-dim bg-tertiary-fixed/10' }
          ].map((col) => {
            const colTasks = getColTasks(col.id);
            return (
              <div 
                key={col.id} 
                className={`rounded-xxl border border-outline-variant/30 border-t-4 ${col.color} p-4 flex flex-col min-h-[450px] space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-primary text-xs uppercase tracking-wider">{col.title}</h4>
                  <span className="text-xs px-2.5 py-0.5 bg-surface-container border border-outline-variant/30 rounded-full text-on-surface-variant font-bold font-mono">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {colTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-24 border border-dashed border-outline-variant/40 rounded-xl text-xs text-on-surface-variant/70 font-semibold italic">
                      No deliverables in stage
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/50 transition-all shadow-sm relative group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <StatusBadge status={task.priority} />
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {col.id !== 'done' && (
                                <button
                                  onClick={() => handleStatusChange(task.id, col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'done' : 'done')}
                                  title="Advance Stage"
                                  className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {['admin', 'coordinator'].includes(user.role) && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Delete Task"
                                  className="p-1 hover:bg-error-container/20 rounded text-on-surface-variant hover:text-error cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h5 className="font-semibold text-primary text-sm line-clamp-2 leading-snug">{task.title}</h5>
                          {task.description && (
                            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">{task.description}</p>
                          )}

                          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>Assignee: <strong className="text-primary font-semibold">{task.owner ? task.owner.name : 'Unassigned'}</strong></span>
                            <span className="font-semibold text-secondary font-mono">{task.deadline || 'N/A'}</span>
                          </div>

                          {col.id === 'blocked' && (
                            <div className="pt-1.5 flex gap-1.5">
                              <button
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                className="w-full py-1.5 text-[10px] bg-secondary-container/10 hover:bg-secondary-container/20 border border-secondary/35 rounded font-bold uppercase tracking-wider text-secondary text-center cursor-pointer font-sans"
                              >
                                Unblock
                              </button>
                            </div>
                          )}
                          
                          {['todo', 'in_progress'].includes(col.id) && (
                            <div className="pt-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStatusChange(task.id, 'blocked')}
                                className="w-full py-1.5 text-[10px] bg-error-container/20 hover:bg-error-container/30 border border-error/25 rounded font-bold uppercase tracking-wider text-error text-center cursor-pointer font-sans"
                              >
                                Block Task
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-primary/25 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/40 p-6 rounded-xxl relative shadow-md">
            <h3 className="text-xl font-display text-primary mb-4">Create Operational Task</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-error-container/20 border border-error/30 rounded-xl text-xs text-error font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="Draft project scope deliverables agreement"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full console-input pl-1 py-2 text-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the tasks specifics, dependencies, and requirements..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="w-full console-input pl-1 py-2 text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full console-input pl-1 py-2 text-primary bg-surface"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Deadline</label>
                  <input
                    type="text"
                    placeholder="Friday, or 2026-06-01"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full console-input pl-1 py-2 text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Assignee</label>
                <select
                  value={taskOwner}
                  onChange={(e) => setTaskOwner(e.target.value)}
                  className="w-full console-input pl-1 py-2 text-primary bg-surface"
                >
                  <option value="">Select Assignee (Unassigned)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-sm text-primary font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-sm text-on-primary font-semibold transition-all cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-primary/25 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 p-6 rounded-xxl relative shadow-md">
            <h3 className="text-xl font-display text-primary mb-2">Workspace Members</h3>
            <p className="text-xs text-on-surface-variant mb-4">Add members to collaborate in the "{selectedTeam?.name}" team.</p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="priya@opspilot.ai"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1 console-input pl-1 py-2 text-primary"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg text-sm text-on-primary font-semibold transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6 space-y-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Active Collaborators</span>
              <div className="max-h-[200px] overflow-y-auto space-y-2.5 pr-1 mt-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm py-2.5 border-b border-outline-variant/20 last:border-0">
                    <div>
                      <strong className="text-primary font-semibold block">{m.name}</strong>
                      <span className="text-xs text-on-surface-variant">{m.email}</span>
                    </div>
                    <StatusBadge status={m.role} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-sm text-primary font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
