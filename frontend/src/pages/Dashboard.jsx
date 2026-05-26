import React, { useState, useEffect } from 'react';
import { taskService, teamService } from '../services/api';
import StatusBadge from '../components/badges/StatusBadge';
import AIIndicator from '../components/shared/AIIndicator';
import { Clock, Users, TrendingUp, Sparkles, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const allTasks = await taskService.list();
      const allTeams = await teamService.list();
      setTasks(allTasks);
      setTeams(allTeams);
      
      const insightsList = [];
      const blocked = allTasks.filter(t => t.status === 'blocked');
      const overdue = allTasks.filter(t => t.status !== 'done' && t.deadline && t.deadline.toLowerCase().includes('overdue'));
      
      if (blocked.length > 0) {
        insightsList.push({
          type: 'error',
          text: `Critical Blockers: ${blocked.length} execution pipelines are currently blocked (e.g., "${blocked[0].title}").`
        });
      }
      if (overdue.length > 0) {
        insightsList.push({
          type: 'warning',
          text: `Timeline Slippage: ${overdue.length} tasks are overdue. Immediate coordinator attention required.`
        });
      }
      
      const loadMap = {};
      allTasks.forEach(t => {
        if (t.owner) {
          loadMap[t.owner.name] = (loadMap[t.owner.name] || 0) + 1;
        }
      });
      const topLoader = Object.entries(loadMap).sort((a, b) => b[1] - a[1])[0];
      if (topLoader) {
        insightsList.push({
          type: 'info',
          text: `Workload Alert: ${topLoader[0]} is managing ${topLoader[1]} active tasks. Consider load balancing.`
        });
      }
      
      if (insightsList.length === 0) {
        insightsList.push({
          type: 'synced',
          text: "Operations Optimal: All systems normal. Clear task velocities and deadlines."
        });
      }
      setInsights(insightsList);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => tasks.filter(t => t.status === status).length;
  const getPriorityCount = (priority) => tasks.filter(t => t.priority === priority).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedRate = tasks.length ? Math.round((getStatusCount('done') / tasks.length) * 100) : 0;
  const activeStreamsCount = tasks.length * 3 + 12;

  return (
    <div className="space-y-10">
      
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <p className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">Good morning, Director</p>
          <h2 className="font-display text-4xl text-primary tracking-tight">Strategic Overview</h2>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-primary text-on-primary font-sans text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95 cursor-pointer"
        >
          Refresh Panel
        </button>
      </section>

      {/* AI Active Insights Banner */}
      <section className="bg-surface-container-lowest rounded-xxl border border-secondary/35 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
          <h3 className="font-display text-lg text-primary">Active AI Insights</h3>
          <AIIndicator label="Active Intelligence" />
        </div>
        <div className="space-y-3">
          {insights.map((ins, idx) => (
            <div key={idx} className="text-xs flex items-start gap-2.5 text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                ins.type === 'error' ? 'bg-error sage-pulse' : 
                ins.type === 'warning' ? 'bg-secondary animate-pulse' : 
                ins.type === 'info' ? 'bg-primary' : 
                'bg-tertiary-fixed-dim'
              }`}></span>
              <p className="font-sans leading-relaxed text-sm">{ins.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Bento Grid Layout */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Sprints Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xxl border border-secondary/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-64 overflow-hidden relative group">
          <div>
            <span className="material-symbols-outlined text-secondary text-4xl mb-4">bolt</span>
            <h3 className="font-display text-xl text-primary font-semibold">Active Sprints</h3>
            <p className="font-sans text-sm text-on-surface-variant mt-1">{tasks.length} concurrent deployments</p>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-5xl text-primary">{String(tasks.length).padStart(2, '0')}</span>
            <div className="flex -space-x-2">
              <img 
                alt="Team member" 
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuANtDhMNf0xCSd68Q9W7tw3Ybv-6hOsiwQWmgVdQ54hZt653LbbepN-F0AgdfjfO76EW0AYkp8nbKYUON5iNG7g-seKCmN2e8oQb80LBoMZqRzQeBHZtQdLag9jFTd6CJGrLlroMinT1QRYvxWbhB-_dCxpi72CVRzHsJ_etnx36uj7w2CyJlTDY1h5yDIX3hPXgFmOWcZ03jo5nAhVFFOHOMxo2pNLJFRH-rGD7_0ik6cHZKVgBO1HhP43VNR2BKiuqkDdTilTo7g"
              />
              <img 
                alt="Team member" 
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAntcXGv99l6heLRryLkVG8CfENRnYVMQ5hv4xZO4ADB4efikneHhL5doKeRZu-n2FIAdZB7gdhzf5tT_PqGNTG6C6soiWRuPyvCmIHwfPCTupK4C47mJ99djNhflRWlpwP_ckuzFqJ4kYWM53YtMuagyw9z-ICPkxJdB3_jcDocwQJTlj-yLkP0H6gfc0d8fsCsobadWKconb_h5pDOQgtYWFZ42kaF2TYhOA4vN6DNQl25p28X-B-N0YK7UXsBKWnwH7MWNBkxlI"
              />
            </div>
          </div>
        </div>

        {/* AI Streams Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xxl border border-tertiary-fixed/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-64 overflow-hidden relative">
          <div className="absolute top-4 right-4">
            <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim sage-pulse"></div>
          </div>
          <div>
            <span className="material-symbols-outlined text-on-tertiary-container text-4xl mb-4">hub</span>
            <h3 className="font-display text-xl text-primary font-semibold">AI Streams</h3>
            <p className="font-sans text-sm text-on-surface-variant mt-1">Real-time data synthesis active</p>
          </div>
          <div className="bg-tertiary-fixed/10 p-4 rounded-xl border border-tertiary-fixed/30 mt-4">
            <p className="font-sans text-xs text-on-tertiary-fixed-variant italic">"Market anomaly detected in North Region flow. Readjusting supply weights..."</p>
          </div>
        </div>

        {/* Bottlenecks Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xxl border border-error/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-64">
          <div>
            <span className="material-symbols-outlined text-error text-4xl mb-4">warning</span>
            <h3 className="font-display text-xl text-primary font-semibold">Bottlenecks</h3>
            <p className="font-sans text-sm text-on-surface-variant mt-1">{getStatusCount('blocked')} high-priority delays</p>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <div className="h-2 flex-1 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-error rounded-full transition-all duration-300"
                style={{ width: `${tasks.length ? (getStatusCount('blocked') / tasks.length) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="font-sans text-[10px] font-bold text-error uppercase tracking-wider">CRITICAL</span>
          </div>
        </div>

      </section>

      {/* Main Section: Team Operations & Execution Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span 2: Team Operations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xxl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-display text-2xl text-primary">Team Operations</h3>
                <p className="font-sans text-xs text-on-surface-variant mt-0.5">Tracking current throughput &amp; task ownership</p>
              </div>
            </div>
            <div className="divide-y divide-outline-variant/20 max-h-[450px] overflow-y-auto pr-1">
              {tasks.filter(t => t.status !== 'done').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/70 italic text-xs">
                  <CheckCircle className="w-8 h-8 text-on-surface-variant/60 mb-2" />
                  No pending operations tasks
                </div>
              ) : (
                tasks.filter(t => t.status !== 'done').map((task) => (
                  <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface transition-colors group px-2 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined">architecture</span>
                      </div>
                      <div>
                        <h4 className="font-display text-base text-primary italic group-hover:not-italic transition-all font-semibold leading-snug">{task.title}</h4>
                        <p className="font-sans text-xs text-on-surface-variant mt-0.5">Lead: {task.owner ? task.owner.name : 'Unassigned'} • Deadline: {task.deadline || 'No Deadline'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <StatusBadge status={task.status === 'blocked' ? 'blocked' : task.priority} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Span 1: Execution Metrics */}
        <div className="bg-surface-container-lowest rounded-xxl border border-outline-variant/30 p-6 shadow-sm h-fit">
          <h3 className="font-display text-xl text-primary mb-6">Execution Metrics</h3>
          <div className="space-y-6">
            
            {/* Completion Done progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Done Velocity</span>
                <span className="text-secondary font-bold text-sm">{completedRate}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/20">
                <div 
                  className="h-full bg-secondary rounded-full transition-all duration-500" 
                  style={{ width: `${completedRate}%` }}
                ></div>
              </div>
            </div>

            {/* Status counts mixes */}
            <div className="space-y-3 pt-4 border-t border-outline-variant/25">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block pb-2">Status Shards Mix</span>
              {[
                { label: 'Todo', count: getStatusCount('todo'), color: 'bg-surface-container border border-outline-variant/30 text-primary' },
                { label: 'In Progress', count: getStatusCount('in_progress'), color: 'bg-secondary-container/10 border border-secondary/35 text-secondary' },
                { label: 'Blocked', count: getStatusCount('blocked'), color: 'bg-error-container/20 border border-error/25 text-error sage-pulse' },
                { label: 'Completed', count: getStatusCount('done'), color: 'bg-tertiary-fixed/20 border border-tertiary-fixed/30 text-on-tertiary-fixed-variant' }
              ].map((st, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-outline-variant/10 last:border-0 select-none">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">{st.count}</span>
                </div>
              ))}
            </div>
            
          </div>
        </div>

      </section>

      {/* Bottom Section: System Logs */}
      <section className="pt-6">
        <div className="relative py-8 mb-4">
          <div aria-hidden="true" className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-6 font-sans text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] select-none">System Logs</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xxl border border-outline-variant/30 p-6 space-y-0">
          <div className="flex gap-6 py-4 border-b border-outline-variant/20">
            <div className="font-mono text-xs text-on-surface-variant/80 w-24 pt-0.5">09:12 AM</div>
            <div className="flex-1">
              <h5 className="font-sans text-sm font-bold text-primary">Automatic re-balancing initiated</h5>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">Cluster 4A resources shifted to mitigate latency in Europe-West.</p>
            </div>
          </div>
          <div className="flex gap-6 py-4 border-b border-outline-variant/20">
            <div className="font-mono text-xs text-on-surface-variant/80 w-24 pt-0.5">08:45 AM</div>
            <div className="flex-1">
              <h5 className="font-sans text-sm font-bold text-primary">New integration verified</h5>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">SAP connector established successfully for Enterprise accounts.</p>
            </div>
          </div>
          <div className="flex gap-6 py-4 last:border-0 pb-0">
            <div className="font-mono text-xs text-on-surface-variant/80 w-24 pt-0.5">07:30 AM</div>
            <div className="flex-1">
              <h5 className="font-sans text-sm font-bold text-primary">Daily Intelligence Digest compiled</h5>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">Sent to executive dashboard for review.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
