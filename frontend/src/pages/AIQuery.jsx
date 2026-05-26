import React, { useState, useEffect } from 'react';
import { queryService, docService } from '../services/api';
import PromptConsole from '../components/ai/PromptConsole';
import StatusBadge from '../components/badges/StatusBadge';
import AIIndicator from '../components/shared/AIIndicator';
import { FileText, UploadCloud, Trash2, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';

export default function AIQuery({ user }) {
  const [query, setQuery] = useState('');
  
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your OpsPilot AI Coordinator. I have persistent semantic access to your team's workspace tasks, timelines, and uploaded transcripts.\n\nI've indexed the recent organizational memory. Ask me anything! For example: *'Are there any overdue tasks?'* or *'What was discussed in the sponsorship sync?'*",
      hasChecklist: true
    }
  ]);
  
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [querying, setQuerying] = useState(false);
  
  // Direct text upload states
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [uploadingText, setUploadingText] = useState(false);
  
  const [error, setError] = useState('');

  // Interactive Checklist states matching design references
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Update Q3 Gold Tier brochures", owner: "Sarah", completed: false },
    { id: 2, text: "Draft follow-up email to PepsiCo", owner: "James", completed: true },
    { id: 3, text: "Book catering walkthrough for Oct 12", owner: "Admin", completed: false }
  ]);
  const [jiraSyncStatus, setJiraSyncStatus] = useState('idle'); // idle, syncing, synced

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const docs = await docService.list();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSendQuery = async (e, forcedQuery = null) => {
    if (e) e.preventDefault();
    const queryToSend = forcedQuery || query;
    if (!queryToSend || !queryToSend.trim()) return;

    setError('');
    const userMsg = { sender: 'user', text: queryToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setQuerying(true);

    try {
      const response = await queryService.ask(queryToSend);
      // Determine if checklist should be rendered
      const hasList = queryToSend.toLowerCase().includes('action') || 
                      queryToSend.toLowerCase().includes('task') || 
                      queryToSend.toLowerCase().includes('transcript');

      const assistantMsg = {
        sender: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        hasChecklist: hasList
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError("AI query execution failed. Please verify the gateway connection.");
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "🛑 Error: I encountered an issue querying the operational database. Please ensure the local user-space Postgres instance is active and seeded."
      }]);
    } finally {
      setQuerying(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    try {
      setLoadingDocs(true);
      await docService.upload(file);
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Error uploading document file.");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !docText.trim()) return;
    setError('');
    setUploadingText(true);

    try {
      await docService.uploadText(docName, docText);
      setDocName('');
      setDocText('');
      await fetchDocuments();
    } catch (err) {
      setError("Error submitting transcript text.");
    } finally {
      setUploadingText(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Delete this document chunk registry from memory?")) return;
    try {
      await docService.delete(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleChecklistItem = (itemId) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const triggerJiraSync = () => {
    if (jiraSyncStatus !== 'idle') return;
    setJiraSyncStatus('syncing');
    setTimeout(() => {
      setJiraSyncStatus('synced');
    }, 1500);
  };

  // Find active grounded context document
  const activeContextDoc = documents.length > 0 
    ? documents[documents.length - 1].file_name 
    : "Sponsorship Sync May24 Transcript.txt";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Chat Area (Left Column - Span 2) */}
      <div className="xl:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xxl flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* Grounded Active Context Header Banner */}
        <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-secondary-container/10 border border-secondary/35 rounded-xl text-secondary shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans leading-none">Grounded Active Context</span>
              <span className="text-xs text-primary font-semibold truncate font-mono mt-1 leading-none">{activeContextDoc}</span>
            </div>
          </div>
          <AIIndicator label="Grounded Active" />
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-bg/10">
          <div className="flex justify-center my-2">
            <span className="font-sans text-[10px] px-3 py-1 bg-surface-container border border-outline-variant/20 rounded-full text-on-surface-variant uppercase tracking-widest font-semibold">
              Security Session Active
            </span>
          </div>

          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3.5 max-w-[95%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Profile Avatar Chip */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-sans font-bold uppercase tracking-wider border select-none ${
                msg.sender === 'user' 
                  ? 'bg-secondary-container/15 text-secondary border-secondary/30' 
                  : 'bg-primary text-on-primary border-primary'
              }`}>
                {msg.sender === 'user' ? 'OP' : 'AI'}
              </div>

              <div className="space-y-3.5 max-w-full overflow-x-auto">
                <div className={`p-5 rounded-xxl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-surface-container border border-outline-variant/40 text-primary rounded-tr-none shadow-sm' 
                    : 'bg-surface-container-lowest border border-secondary/35 text-primary rounded-tl-none shadow-sm relative overflow-hidden'
                }`}>
                  {msg.sender === 'assistant' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-secondary/80"></div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</p>
                  
                  {/* Extracted Interactive Checklist inside AI Response */}
                  {msg.sender === 'assistant' && msg.hasChecklist && (
                    <div className="mt-5 bg-surface border border-outline-variant/35 rounded-xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-[36px_1fr_80px] gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant/30 font-sans text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                        <div></div>
                        <div>Task Action Detail</div>
                        <div>Assignee</div>
                      </div>
                      
                      <div className="divide-y divide-outline-variant/20">
                        {checklist.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => toggleChecklistItem(item.id)}
                            className="grid grid-cols-[36px_1fr_80px] items-center gap-2 px-3 py-3 hover:bg-surface-container transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center justify-center">
                              <input 
                                type="checkbox"
                                checked={item.completed}
                                readOnly
                                className="w-4 h-4 bg-transparent border-outline text-secondary focus:ring-0 rounded cursor-pointer"
                              />
                            </div>
                            <span className={`text-[11.5px] text-primary font-sans ${item.completed ? 'line-through opacity-50' : 'font-medium'}`}>
                              {item.text}
                            </span>
                            <span className="font-sans text-[10px] text-secondary font-bold truncate">
                              {item.owner}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Checklist Sync Controls */}
                      <div className="p-3 bg-surface-container-low/50 border-t border-outline-variant/30 flex items-center justify-between gap-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); triggerJiraSync(); }}
                          disabled={jiraSyncStatus !== 'idle'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-[9px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                            jiraSyncStatus === 'syncing' 
                              ? 'bg-secondary-container/10 border border-secondary/35 text-secondary' 
                              : jiraSyncStatus === 'synced' 
                                ? 'bg-tertiary-fixed/20 border border-tertiary-fixed/35 text-on-tertiary-fixed-variant' 
                                : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                          }`}
                        >
                          {jiraSyncStatus === 'syncing' ? (
                            <>
                              <span className="w-2.5 h-2.5 border border-secondary/20 border-t-secondary rounded-full animate-spin"></span>
                              SYNCING...
                            </>
                          ) : jiraSyncStatus === 'synced' ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-secondary"></span>
                              JIRA SYNCED
                            </>
                          ) : (
                            <>SYNC TO JIRA</>
                          )}
                        </button>
                        <span className="text-[10px] font-mono text-on-surface-variant font-semibold">
                          {checklist.filter(i => i.completed).length}/{checklist.length} RESOLVED
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-2 items-center">
                    <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider font-sans">Context Sources:</span>
                    {msg.sources.map((s, sIdx) => (
                      <span key={sIdx} className="text-[9px] font-mono font-bold text-primary bg-surface-container border border-outline-variant/30 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {querying && (
            <div className="flex gap-3.5 mr-auto items-center animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-primary border border-primary flex items-center justify-center text-on-primary font-sans text-[10px] font-bold select-none">
                AI
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant italic text-[11px] font-sans">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span>OpsPilot is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar using our modular PromptConsole */}
        <div className="p-5 border-t border-outline-variant/30 bg-surface-container-low space-y-3 shrink-0">
          <PromptConsole
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSubmit={(e) => handleSendQuery(e)}
            loading={querying}
            placeholder="Search organizational memory or query sprint status..."
          />
          <div className="flex justify-between items-center px-1 font-sans text-[10px] text-on-surface-variant font-semibold">
            <span>ENGINE: GPT-4o // OPSVECTOR-V3</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              3.2K TOKENS REMAINING
            </span>
          </div>
        </div>
      </div>

      {/* Memory & Document Panel (Right Column) */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xxl p-5 flex flex-col h-full overflow-hidden space-y-5 shadow-sm">
        
        <div>
          <h3 className="font-bold text-primary text-xs flex items-center gap-2 uppercase tracking-wider font-sans">
            <Terminal className="w-4 h-4 text-secondary shrink-0" />
            Semantic Registers
          </h3>
          <p className="text-[10px] text-on-surface-variant mt-1">Upload meeting notes, transcripts, or plain text to build context</p>
        </div>

        {/* Text upload form */}
        <form onSubmit={handleTextSubmit} className="space-y-3 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20 shrink-0">
          <input
            type="text"
            required
            placeholder="Label (e.g. sponsorship_sync)"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full pl-1 py-1.5 console-input text-primary text-xs font-mono"
          />
          <textarea
            required
            placeholder="Paste transcript or logs here..."
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            rows={3}
            className="w-full pl-1 py-1.5 console-input text-primary text-xs resize-none font-mono"
          />
          <button
            type="submit"
            disabled={uploadingText || loadingDocs}
            className="w-full py-2 bg-primary hover:opacity-90 rounded-lg text-xs text-on-primary font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {uploadingText ? 'Ingesting...' : 'Ingest Log to Memory'}
          </button>
        </form>

        {/* File Uploader */}
        <div className="relative border border-dashed border-outline-variant/40 hover:border-secondary bg-surface-container-low/20 rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center shrink-0">
          <UploadCloud className="w-6 h-6 text-on-surface-variant mb-1.5" />
          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Upload .txt files</span>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            disabled={loadingDocs}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Memory Registry list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block font-sans border-b border-outline-variant/20 pb-1.5">Persistent Memory Modules</span>
          
          {loadingDocs && documents.length === 0 ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/70 text-xs italic">
              <FileText className="w-8 h-8 mb-1.5 text-on-surface-variant/50" />
              <span>No documents indexed in memory</span>
            </div>
          ) : (
            documents.map((doc) => (
              <div 
                key={doc.id} 
                className="p-3 rounded-lg border border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between gap-3 hover:border-outline-variant/35 transition-colors"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="text-[11px] font-mono text-primary truncate block font-semibold">{doc.file_name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-on-surface-variant/70 block truncate">BY: {doc.uploaded_by}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={doc.embedding_status} />
                  
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1 hover:bg-error-container/20 rounded text-on-surface-variant hover:text-error transition-colors cursor-pointer animate-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
