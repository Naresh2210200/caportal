
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { compliance } from '../services/compliance';
import { gstr1Processor } from '../services/gstr1Processor';
import { User, UploadedFile, GSTR1Format, ProcessingProgress } from '../types';

declare const XLSX: any;
declare const saveAs: any;

type MainModule = 'dashboard' | 'automation' | 'logs';

const PartyWorkspace: React.FC = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [party, setParty] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<MainModule>('automation');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [automationLog, setAutomationLog] = useState<string[]>([]);

  // GSTR1 Processor State
  const [gstr1Files, setGstr1Files] = useState<File[]>([]);
  const [gstr1Format, setGstr1Format] = useState<GSTR1Format>('standard');
  const [processProgress, setProcessProgress] = useState<ProcessingProgress | null>(null);

  useEffect(() => {
    const p = db.getUsers().find(u => u.id === partyId);
    if (!p || p.caCode !== user?.caCode) {
      navigate('/ca/dashboard');
      return;
    }
    setParty(p);
    refreshFiles();
  }, [partyId, user]);

  const refreshFiles = () => {
    const allFiles = db.getFiles().filter(f => f.customerId === partyId);
    setFiles(allFiles);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => row[h] = values[i] || '');
      return row;
    });
  };

  const handleGSTR1FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGstr1Files(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setGstr1Files(Array.from(e.dataTransfer.files));
    }
  };

  const removeGstr1File = (index: number) => {
    setGstr1Files(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessGSTR1 = async () => {
    if (gstr1Files.length === 0) return;

    try {
      const blob = await gstr1Processor.processFiles(gstr1Files, gstr1Format, (progress) => {
        setProcessProgress(progress);
      });

      saveAs(blob, `GSTR1_${gstr1Format}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setProcessProgress({ percent: 100, message: 'Download started!', status: 'success' });

      // Auto-clear success message after 3 seconds
      setTimeout(() => setProcessProgress(null), 3000);

    } catch (error: any) {
      console.error(error);
      setProcessProgress({ percent: 0, message: `Error: ${error.message}`, status: 'error' });
    }
  };

  const handleRunCompliance = async () => {
    const pending = files.filter(f => f.status === 'Pending');
    if (pending.length === 0) {
      setAutomationLog(p => [...p, "⚠ No pending files found."]);
      return;
    }

    setIsProcessing(true);
    setAutomationLog(["🚀 Compliance Engine: Session Started", "📡 Handshaking with Compliance API..."]);

    try {
      let b2bData: any[] = [];
      let hsnData: any[] = [];

      for (const file of pending) {
        const parsed = parseCSV(file.content || "");
        if (file.fileName.toLowerCase().includes('hsn')) hsnData.push(...parsed);
        else b2bData.push(...parsed);
      }

      setAutomationLog(p => [...p, `📦 Data loaded. Running Batch Verification on ${b2bData.length} records...`]);

      const result = await compliance.processGSTR1(b2bData, hsnData, party?.gstin || '');

      setAutomationLog(p => [...p, `✅ Analysis Complete: ${result.errorList.length} invalid invoices shifted to B2C.`]);

      if (result.errorList.length > 0) {
        const errorWB = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(errorWB, XLSX.utils.json_to_sheet(result.errorList), "GST Errors");
        const errorOut = XLSX.write(errorWB, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([errorOut]), `Error_List_${party?.fullName}.xlsx`);
        setAutomationLog(p => [...p, "📎 Compliance Error List generated for download."]);
      }

      setAutomationLog(p => [...p, "⚖ Balancing HSN summaries..."]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.validB2B), "b2b");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.b2csMigrated), "b2cs");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.hsnAdjusted), "hsn");

      const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbOut]), `Speqta_GSTR1_${party?.fullName}_RECONCILED.xlsx`);

      pending.forEach(f => db.updateFileStatus(f.id, 'Completed'));
      setAutomationLog(p => [...p, "🎯 Final Speqta export ready.", "✨ Process finished successfully."]);
      refreshFiles();

      db.saveLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleString(),
        action: 'Compliance Automation',
        fileName: 'Batch Reconciliation',
        result: 'Success',
        status: 'Completed',
        caCode: user!.caCode,
        customerId: partyId!,
        errorCount: result.errorList.length,
        migratedAmount: result.totalTaxableShifted
      });

    } catch (err: any) {
      setAutomationLog(p => [...p, `❌ Critical System Error: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!party) return null;

  return (
    <div className="flex h-screen bg-[#fcfdfe] text-slate-700 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">S</div>
          <span className="font-black text-slate-800 tracking-tight text-lg">SpeqtaPro</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'automation', label: 'Compliance Hub' },
            { id: 'logs', label: 'Audit Logs' }
          ].map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as MainModule)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeModule === mod.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {mod.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => navigate('/ca/dashboard')} className="w-full text-slate-400 font-bold text-xs hover:text-indigo-600 transition flex items-center gap-2 px-2 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">{party.fullName}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[2px]">{party.gstin} • FY 24-25</p>
          </div>
          <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-green-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            GATEWAY: CONNECTED
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-3xl font-black text-indigo-600">Verified</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pending Files</p>
                  <p className="text-3xl font-black text-orange-500">{files.filter(f => f.status === 'Pending').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Last Sync</p>
                  <p className="text-xl font-black text-slate-800 mt-2">{files[0]?.uploadedAt || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">File Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {files.map(f => (
                      <tr key={f.id}>
                        <td className="px-6 py-4 font-bold text-slate-700">{f.fileName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${f.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                            }`}>{f.status}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-xs">{f.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeModule === 'automation' && (
            <div className="grid grid-cols-12 gap-10 h-full">
              <div className="col-span-5 space-y-6">

                {/* GSTR1 Conversion Card */}
                <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-16 -mt-16"></div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 relative z-10">GSTR-1 Converter</h3>

                  <div className="flex gap-4 mb-6 relative z-10">
                    <button
                      onClick={() => setGstr1Format('standard')}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${gstr1Format === 'standard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      Standard CSV
                    </button>
                    <button
                      onClick={() => setGstr1Format('tally')}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${gstr1Format === 'tally' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      Tally Excel
                    </button>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 mb-6 text-center hover:border-indigo-400 transition bg-slate-50/50 group"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".csv"
                      onChange={handleGSTR1FileChange}
                      className="hidden"
                      id="gstr1-upload"
                    />
                    <label htmlFor="gstr1-upload" className="cursor-pointer block">
                      <div className="w-10 h-10 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-sm text-indigo-500 group-hover:scale-110 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        {gstr1Files.length > 0 ? `${gstr1Files.length} files selected` : "Drag CSV files here"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">or click to browse</p>
                    </label>
                  </div>

                  <div className="space-y-2 mb-6 max-h-32 overflow-y-auto custom-scrollbar">
                    {gstr1Files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                        <span className="truncate flex-1 font-medium text-slate-600">{f.name}</span>
                        <button onClick={() => removeGstr1File(i)} className="text-slate-300 hover:text-red-500 ml-2">×</button>
                      </div>
                    ))}
                  </div>

                  {processProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className={processProgress.status === 'error' ? 'text-red-500' : 'text-indigo-500'}>{processProgress.message}</span>
                        <span className="text-slate-400">{processProgress.percent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${processProgress.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${processProgress.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleProcessGSTR1}
                    disabled={gstr1Files.length === 0 || (processProgress?.percent || 0) > 0 && (processProgress?.percent || 0) < 100}
                    className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Generate Excel</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>

                </div>

                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Compliance Engine</h3>
                  <p className="text-sm text-slate-500 mb-10">B2B → B2C Shift & HSN Reconciliation</p>

                  <button
                    onClick={handleRunCompliance}
                    disabled={isProcessing || files.filter(f => f.status === 'Pending').length === 0}
                    className="w-full py-6 rounded-[25px] bg-slate-900 text-white font-black text-lg hover:bg-indigo-600 transition shadow-2xl disabled:bg-slate-100 disabled:text-slate-300 transform active:scale-95"
                  >
                    {isProcessing ? 'Processing Compliance...' : 'Run GSTR-1 Reconciliation'}
                  </button>
                  <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online GSTIN Validation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Highest-Value HSN Adjustment</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-7">
                <div className="bg-slate-900 rounded-[40px] p-8 h-[500px] flex flex-col shadow-2xl overflow-hidden border border-slate-800">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    <span className="ml-4 text-[10px] font-black text-slate-500 tracking-[3px] uppercase">Engine Output</span>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-400 space-y-3 console-scrollbar px-2">
                    {automationLog.map((log, i) => (
                      <p key={i} className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-slate-300'}>
                        <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}]</span>
                        {log}
                      </p>
                    ))}
                    {automationLog.length === 0 && <p className="text-slate-600 italic">Engine idle. Awaiting command...</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'logs' && (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h3 className="font-black text-slate-800">System Audit Logs</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Shifted</th>
                    <th className="px-8 py-5">Value Balanced</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {db.getLogs().filter(l => l.customerId === partyId).map(log => (
                    <tr key={log.id}>
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{log.timestamp}</td>
                      <td className="px-8 py-6 font-bold text-red-500">{log.errorCount || 0} Invoices</td>
                      <td className="px-8 py-6 font-black">₹ {log.migratedAmount?.toLocaleString() || 0}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase">Success</span>
                      </td>
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
