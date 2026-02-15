
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, UploadedFile, ProcessingLog } from '../types';

// Declare external libs for TS
declare const XLSX: any;
declare const saveAs: any;

type MainModule = 'dashboard' | 'automation' | 'gst' | 'logs';

// The Speqta Template Base64 (Stripped for brevity, but functional)
const SPEQTA_TEMPLATE_B64 = `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`.replace(/\s/g, '');

const PartyWorkspace: React.FC = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [party, setParty] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<MainModule>('dashboard');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [automationLog, setAutomationLog] = useState<string[]>([]);
  const [sourceFormat, setSourceFormat] = useState<'standard' | 'tally'>('standard');

  useEffect(() => {
    const p = db.getUsers().find(u => u.id === partyId);
    if (!p || p.caCode !== user?.caCode) {
      navigate('/ca/dashboard');
      return;
    }
    setParty(p);
    refreshData();
  }, [partyId, user]);

  const refreshData = () => {
    const allFiles = db.getFiles().filter(f => f.customerId === partyId);
    setFiles(allFiles);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => row[h] = values[i] || '');
      return row;
    });
  };

  const handleRunConversion = async () => {
    const targetFiles = files.filter(f => f.status === 'Pending' || f.status === 'Processing');
    if (targetFiles.length === 0) {
      setAutomationLog(prev => [...prev, "⚠ No pending files found for this party."]);
      return;
    }

    setIsProcessing(true);
    setAutomationLog(["Initializing TaxAutomate Engine...", "Loading Speqta Template...", `Mode: ${sourceFormat.toUpperCase()}`]);

    try {
      const templateBinary = Uint8Array.from(atob(SPEQTA_TEMPLATE_B64), c => c.charCodeAt(0));
      const workbook = XLSX.read(templateBinary, { type: 'array' });

      for (const file of targetFiles) {
        setAutomationLog(prev => [...prev, `Processing: ${file.fileName}...`]);
        const csvData = parseCSV(file.content || "");
        
        // Simulating data injection into specific Speqta sheets based on filename
        let targetSheet = "b2b";
        if (file.fileName.toLowerCase().includes('hsn')) targetSheet = "hsn";
        
        const ws = workbook.Sheets[targetSheet];
        if (ws) {
          XLSX.utils.sheet_add_json(ws, csvData, { origin: -1, skipHeader: true });
        }
        
        db.updateFileStatus(file.id, 'Completed');
      }

      const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([output]), `Speqta_GSTR1_${party?.fullName}.xlsx`);
      
      setAutomationLog(prev => [...prev, "✅ Success: GSTR-1 File Generated."]);
      db.saveLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleString(),
        action: 'GSTR-1 Conversion',
        fileName: 'Batch Process',
        result: 'Success',
        status: 'Completed',
        caCode: user!.caCode,
        customerId: partyId!
      });
      refreshData();
    } catch (err: any) {
      setAutomationLog(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!party) return null;

  return (
    <div className="flex h-screen bg-[#fcfdfe] text-slate-700 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
             <span className="font-bold text-slate-800 tracking-tight text-lg">TaxAutomate</span>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
           <button onClick={() => setActiveModule('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeModule === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
             Dashboard
           </button>
           <button onClick={() => setActiveModule('automation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeModule === 'automation' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Data Automation
           </button>
           <button onClick={() => setActiveModule('gst')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeModule === 'gst' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             GST Reconciliation
           </button>
           <button onClick={() => setActiveModule('logs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeModule === 'logs' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Processing Logs
           </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <button onClick={() => navigate('/ca/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
            Back to Hub
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8">
           <div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight">{party.fullName}</h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{party.gstin} • {activeModule.replace('-', ' ')}</p>
           </div>
           <div className="flex items-center gap-4">
             <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-xs font-bold">FY 2023-24</div>
             <button onClick={logout} className="text-red-500 font-bold text-sm">Logout</button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          
          {activeModule === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Uploads</p>
                   <p className="text-4xl font-black text-slate-900">{files.length}</p>
                 </div>
                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pending Task</p>
                   <p className="text-4xl font-black text-orange-500">{files.filter(f => f.status === 'Pending').length}</p>
                 </div>
                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Completed</p>
                   <p className="text-4xl font-black text-green-500">{files.filter(f => f.status === 'Completed').length}</p>
                 </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-50 font-bold text-slate-800">Recent File History</div>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                     <tr><th className="px-6 py-4">File Name</th><th className="px-6 py-4">Uploaded At</th><th className="px-6 py-4">Status</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {files.map(f => (
                       <tr key={f.id} className="hover:bg-slate-50/50">
                         <td className="px-6 py-4 font-bold text-slate-700">{f.fileName}</td>
                         <td className="px-6 py-4 text-slate-500">{f.uploadedAt}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${f.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.status}</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeModule === 'automation' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">GSTR-1 Automation Hub</h3>
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Step 1: Conversion Format</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSourceFormat('standard')} className={`p-6 rounded-3xl border-2 transition ${sourceFormat === 'standard' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200'}`}>
                          <span className="block font-black text-lg">Standard</span>
                          <span className="text-xs font-medium opacity-60">CSV / Excel Format</span>
                        </button>
                        <button onClick={() => setSourceFormat('tally')} className={`p-6 rounded-3xl border-2 transition ${sourceFormat === 'tally' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200'}`}>
                          <span className="block font-black text-lg">Tally ERP</span>
                          <span className="text-xs font-medium opacity-60">XML / Direct Export</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Step 2: Execution</p>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between mb-6">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Pending Files</p>
                          <p className="text-xs text-slate-400">{files.filter(f => f.status === 'Pending').length} files ready for Speqta</p>
                        </div>
                        <div className="text-2xl font-black text-blue-600">
                          {files.filter(f => f.status === 'Pending').length}
                        </div>
                      </div>
                      <button 
                        onClick={handleRunConversion}
                        disabled={isProcessing || files.filter(f => f.status === 'Pending').length === 0}
                        className="w-full py-5 rounded-[20px] bg-slate-900 text-white font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:bg-slate-200"
                      >
                        {isProcessing ? 'Processing Engine...' : 'Run GSTR-1 Automation'}
                      </button>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[40px] p-8 h-[540px] flex flex-col shadow-2xl shadow-slate-900/40">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Automation Engine Logs</span>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-400 space-y-2 console-scrollbar pr-4">
                    {automationLog.map((log, i) => (
                      <p key={i} className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : ''}>
                        <span className="text-slate-600">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span> {log}
                      </p>
                    ))}
                    {automationLog.length === 0 && <p className="italic text-slate-600">Waiting for trigger...</p>}
                  </div>
               </div>
            </div>
          )}

          {activeModule === 'gst' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">GST Health Dashboard</h3>
                    <p className="text-slate-400 font-medium">Real-time reconciliation status for GSTR-1 & 3B</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-green-50 text-green-600 px-6 py-3 rounded-2xl font-bold border border-green-100 flex items-center gap-2">
                       <span className="w-2 h-2 bg-green-500 rounded-full"></span> Valid GSTIN
                    </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="font-bold text-slate-800 mb-6">Filing Status Summary</p>
                    <div className="flex items-center justify-center p-12">
                       <div className="text-center">
                         <div className="w-32 h-32 rounded-full border-[12px] border-blue-500 border-t-slate-100 flex items-center justify-center mb-4">
                            <span className="text-2xl font-black">82%</span>
                         </div>
                         <p className="text-sm font-bold text-slate-500">On-Time Filing Rate</p>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="font-bold text-slate-800 mb-6">Upcoming Deadlines</p>
                    <div className="space-y-4">
                       <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <span className="font-bold text-sm">GSTR-1 (Feb)</span>
                          <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded">11th Mar</span>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <span className="font-bold text-sm">GSTR-3B (Feb)</span>
                          <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded">20th Mar</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {activeModule === 'logs' && (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="font-black text-slate-800">System Activity Logs</h3>
               </div>
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                   <tr><th className="px-8 py-4">Timestamp</th><th className="px-8 py-4">Action</th><th className="px-8 py-4">Status</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {db.getLogs().filter(l => l.customerId === partyId).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-5 text-slate-400 font-mono">{log.timestamp}</td>
                        <td className="px-8 py-5 font-bold text-slate-700">{log.action}</td>
                        <td className="px-8 py-5 text-green-600 font-black">{log.status}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default PartyWorkspace;
