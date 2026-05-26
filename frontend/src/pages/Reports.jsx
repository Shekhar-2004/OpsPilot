import React, { useState, useEffect } from 'react';
import { taskService, teamService } from '../services/api';
import StatusBadge from '../components/badges/StatusBadge';
import AIIndicator from '../components/shared/AIIndicator';
import OperationalCard from '../components/cards/OperationalCard';
import { ShieldCheck, AlertCircle, Users, BarChart3, TrendingUp, AlertTriangle, ShieldAlert, Activity, Clock } from 'lucide-react';

export default function Reports() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  // Interactive AI Assignment state matching reference bottlenecks panel
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [assignedAgents, setAssignedAgents] = useState({});

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      setLoading(true);
      const allTasks = await taskService.list();
      const allTeams = await teamService.list();
      setTasks(allTasks);
      setTeams(allTeams);

      const blocked = allTasks.filter(t => t.status === 'blocked');
      const completed = allTasks.filter(t => t.status === 'done');
      const active = allTasks.filter(t => t.status !== 'done');
      
      const deadlineRiskTasks = active.filter(t => {
        if (!t.deadline) return false;
        const dl = t.deadline.toLowerCase();
        return dl.includes('overdue') || dl.includes('yesterday') || dl.includes('passed') || dl.includes('tomorrow');
      });

      const loadScores = {};
      allTasks.forEach(t => {
        if (t.status === 'done') return;
        if (!t.owner) return;
        
        let score = 1.0;
        if (t.priority === 'critical') score = 3.0;
        else if (t.priority === 'high') score = 2.0;
        else if (t.priority === 'low') score = 0.5;
        
        loadScores[t.owner.name] = (loadScores[t.owner.name] || 0) + score;
      });

      const overloads = [];
      Object.entries(loadScores).forEach(([name, score]) => {
        if (score >= 4.0) {
          overloads.push({
            name,
            score,
            status: score >= 5.5 ? 'CRITICAL OVERLOAD' : 'HIGH WORKLOAD',
            color: score >= 5.5 ? 'text-error border-error/25 bg-error-container/20' : 'text-secondary border-secondary/35 bg-secondary-container/10'
          });
        }
      });

      const bottleneckNotes = [];
      if (blocked.length > 0) {
        bottleneckNotes.push(`Execution drag identified inside "${blocked[0].team ? blocked[0].team.name : 'Workspace'}". Legal and admin clearances are stalling ${blocked.length} pipelines.`);
      } else {
        bottleneckNotes.push("Zero coordination drag identified. All tasks progressing along execution vectors.");
      }

      setAnalysis({
        overloads,
        deadlineRiskTasks,
        blockedTasksCount: blocked.length,
        completedTasksCount: completed.length,
        activeTasksCount: active.length,
        bottleneckNotes
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = (taskId) => {
    if (assignedAgents[taskId] || assigningTaskId === taskId) return;
    setAssigningTaskId(taskId);
    setTimeout(() => {
      setAssignedAgents(prev => ({ ...prev, [taskId]: true }));
      setAssigningTaskId(null);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
      </div>
    );
  }

  const completionRate = tasks.length ? Math.round((analysis.completedTasksCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <p className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">Forecasting &amp; Risk Coordination</p>
          <h2 className="font-display text-4xl text-primary tracking-tight font-sans">Alerts &amp; Bottlenecks</h2>
        </div>
        <button 
          onClick={fetchIntelligenceData}
          className="px-6 py-2.5 bg-primary text-on-primary font-sans text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          Refresh Alerts
        </button>
      </section>

      {/* Filter & Stats Bar */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Critical Blockers Stats Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-xxl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">Critical Blockers</span>
          <span className="font-mono text-3xl font-bold text-error mt-2">
            {String(analysis.blockedTasksCount).padStart(2, '0')}
          </span>
          <div className="mt-3 h-1 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-error" style={{ width: `${Math.min(100, analysis.blockedTasksCount * 20)}%` }}></div>
          </div>
        </div>

        {/* Avg Time Overdue Stats Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-xxl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">Timeline Risks</span>
          <span className="font-mono text-3xl font-bold text-primary mt-2">
            {String(analysis.deadlineRiskTasks.length).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-secondary font-sans mt-1.5 font-bold tracking-wide uppercase">↓ 12% FROM LAST SPRINT</span>
        </div>

        {/* Sorting options bento */}
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-xxl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">Active Sorting</span>
            <div className="flex gap-2 mt-2.5">
              <span className="px-3.5 py-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm select-none">Severity</span>
              <span className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant text-[10px] font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-all select-none">Time Overdue</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">System Load</span>
            <p className="font-mono text-secondary text-xs mt-2.5 font-bold">CPU: 42% / RAM: 68%</p>
          </div>
        </div>

      </section>

      {/* Missed Deadlines Risk Assessment & Bottlenecks */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Bottlenecks & Timeline Risks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active System Blockers */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xxl p-6 flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-display text-lg text-primary">Active Pipeline Blockers</h3>
              <span className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">MANUAL INTERVENTION REQUIRED</span>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {tasks.filter(t => t.status === 'blocked').length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant/70 text-xs italic">
                  No pipeline processes currently blocked
                </div>
              ) : (
                tasks.filter(t => t.status === 'blocked').map(t => {
                  const isAssigned = assignedAgents[t.id];
                  const isAssigning = assigningTaskId === t.id;
                  
                  return (
                    <div 
                      key={t.id} 
                      className={`p-5 bg-surface border rounded-xl relative overflow-hidden transition-all duration-300 ${
                        isAssigned 
                          ? 'border-secondary/35 shadow-[0_0_12px_rgba(115,92,0,0.03)]' 
                          : 'border-outline-variant/25 hover:border-error/30'
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-[4px] h-full bg-error"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-error-container/20 text-error text-[9px] font-bold px-2 py-0.5 border border-error/25 rounded uppercase tracking-wider font-sans">
                              Critical
                            </span>
                            <span className="text-on-surface-variant font-mono text-[9px] font-bold">ID: SYS-{t.id}-DRAG</span>
                            <span className="text-error font-sans text-[10px] font-bold ml-auto sm:ml-0 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              18H OVERDUE
                            </span>
                          </div>
                          
                          <h4 className="font-semibold text-primary text-sm font-sans pt-1 leading-snug">
                            {t.title}
                          </h4>
                          <p className="text-[11.5px] text-on-surface-variant font-sans leading-relaxed">
                            {t.description || "Sharding logs pipeline process stalls execution flow. Action is stalled inside coordination workspace. Active re-indexing partition recommended."}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            <span className="bg-surface-container text-on-surface-variant font-sans text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-outline-variant/20">
                              {t.team ? t.team.name : 'Event'}
                            </span>
                            <span className="bg-surface-container text-on-surface-variant font-sans text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-outline-variant/20">
                              Postgres-Main
                            </span>
                          </div>
                        </div>

                        {/* Interactive Assign AI Agent Action triggers */}
                        <div className="flex flex-row sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 border-outline-variant/10 pt-3 sm:pt-0">
                          <button
                            onClick={() => handleAssignAgent(t.id)}
                            disabled={isAssigned || isAssigning}
                            className={`flex items-center justify-center gap-1.5 font-sans text-[9px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border transition-all active:scale-95 select-none cursor-pointer ${
                              isAssigned 
                                ? 'bg-tertiary-fixed/20 border-tertiary-fixed/35 text-on-tertiary-fixed-variant animate-pulse shadow-sm' 
                                : isAssigning
                                  ? 'bg-secondary-container/10 border-secondary/35 text-secondary cursor-wait'
                                  : 'bg-primary hover:opacity-90 border-primary text-on-primary shadow-sm'
                            }`}
                          >
                            {isAssigning ? (
                              <>
                                <span className="w-2.5 h-2.5 border border-secondary/20 border-t-secondary rounded-full animate-spin"></span>
                                ASSIGNING...
                              </>
                            ) : isAssigned ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                AGENT ASSIGNED
                              </>
                            ) : (
                              <>ASSIGN AI AGENT</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Missed Deadlines Risk Assessment */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xxl p-6 flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-display text-lg text-primary">Missed Deadlines Timeline Risks</h3>
              <span className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">ELEVATED FORECAST RISK</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {analysis.deadlineRiskTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/70 text-xs italic">
                  <ShieldCheck className="w-8 h-8 text-on-surface-variant/60 mb-2" />
                  <span>Zero timeline risks flagged</span>
                </div>
              ) : (
                analysis.deadlineRiskTasks.map((t) => (
                  <div key={t.id} className="p-4 bg-surface border border-outline-variant/20 rounded-xl hover:border-secondary/30 transition-all flex flex-col gap-2 relative overflow-hidden shadow-xs">
                    <div className="absolute top-0 right-0 h-full w-[4px] bg-secondary"></div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <StatusBadge status="warning" />
                      <span className="text-[10px] text-on-surface-variant font-bold font-sans">DUE: {t.deadline.toUpperCase()}</span>
                    </div>
                    <h4 className="font-semibold text-primary text-sm font-sans leading-snug">{t.title}</h4>
                    <div className="flex justify-between text-[10px] text-on-surface-variant pt-2 border-t border-outline-variant/20 font-sans">
                      <span>ASSIGNEE: <strong className="text-primary font-bold">{t.owner ? t.owner.name.toUpperCase() : 'UNASSIGNED'}</strong></span>
                      <span className="font-bold text-secondary uppercase">{t.status.value || t.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Span 1): Done Speedometer Velocity & Workload Overload matrices */}
        <div className="space-y-6">
          
          {/* Execution Velocity Speedometer Dial */}
          <div className="bg-surface-container-lowest rounded-xxl border border-outline-variant/30 p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <h3 className="font-display text-xl text-primary mb-4 w-full text-left">Execution Velocity</h3>
            <div className="flex flex-col items-center justify-center space-y-4 py-2 select-none">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-surface-container"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-secondary"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * completionRate) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="absolute text-center space-y-0.5">
                  <div className="text-3xl font-display font-bold text-primary">{completionRate}%</div>
                  <div className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">Done Velocity</div>
                </div>
              </div>

              <p className="text-[11.5px] text-on-surface-variant px-4 leading-relaxed font-sans mt-2">
                Percentage of total deliverables resolved. Target optimal execution threshold: <strong>65%</strong>.
              </p>
            </div>
          </div>

          {/* Capacity overload warning indices */}
          <div className="bg-surface-container-lowest rounded-xxl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-primary">Capacity Balance</h3>
              <AIIndicator label="Capacity Index" />
            </div>

            {analysis.overloads.length === 0 ? (
              <div className="p-4 border border-tertiary-fixed/40 bg-tertiary-fixed/15 text-on-tertiary-fixed-variant rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-on-tertiary-fixed-variant shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <strong className="text-xs font-bold block text-primary uppercase tracking-wider">Load Capacity Balanced</strong>
                  <p className="text-[11px] text-on-surface-variant/90 leading-relaxed font-sans mt-1">
                    No workspace members exceed the maximum load threshold of <strong>4.0 points</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.overloads.map((over, idx) => (
                  <div key={idx} className={`p-4 border rounded-xl flex flex-col gap-2 ${over.color}`}>
                    <div className="flex gap-2.5">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-error animate-pulse" />
                      <div>
                        <strong className="text-xs font-bold block text-primary uppercase tracking-wider">{over.name} — {over.status}</strong>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans mt-1">
                          Capacity weight score: <strong>{over.score.toFixed(1)} points</strong> (limit 4.0). Candidate has high-priority blockers.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load Matrix Weight breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-outline-variant/20 mt-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans block">Workspace Load Weight Matrix</span>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {Object.entries(tasks.reduce((acc, t) => {
                  if (t.owner && t.status !== 'done') acc[t.owner.name] = (acc[t.owner.name] || 0) + 1;
                  return acc;
                }, {})).map(([name, count]) => (
                  <div key={name} className="p-3 bg-surface border border-outline-variant/20 rounded-xl text-center shadow-xs">
                    <span className="text-[11px] text-on-surface-variant block truncate font-sans">{name}</span>
                    <strong className="text-base text-primary font-bold block mt-1 font-sans">{count} ACTIVE</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
