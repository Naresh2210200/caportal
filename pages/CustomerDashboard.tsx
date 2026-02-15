
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { db } from '../services/db';
import { UploadedFile } from '../types';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileList, setSelectedFileList] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    financialYear: '2023-24',
    month: 'January',
    note: ''
  });

  useEffect(() => {
    refreshFiles();
  }, [user]);

  const refreshFiles = () => {
    if (user) {
      const myFiles = db.getFiles().filter(f => f.customerId === user.id);
      setFiles(myFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFileList(Array.from(e.target.files));
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedFileList.length === 0) return;
    setIsUploading(true);

    try {
      for (const file of selectedFileList) {
        const content = await readFileAsText(file);
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          customerId: user.id,
          caCode: user.caCode,
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toLocaleString(),
          financialYear: formData.financialYear,
          month: formData.month,
          note: formData.note,
          status: 'Pending',
          content: content
        };
        db.saveFile(newFile);
      }

      setFormData({ ...formData, note: '' });
      setSelectedFileList([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
      refreshFiles();
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  };

  const removeFileFromBatch = (index: number) => {
    const newList = [...selectedFileList];
    newList.splice(index, 1);
    setSelectedFileList(newList);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Workspace</h1>
          <p className="text-sm text-slate-500">Connected CA: {user?.caCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">User: {user?.fullName}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-semibold px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold mb-4">Upload New Documents</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Financial Year</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.financialYear}
                  onChange={e => setFormData({...formData, financialYear: e.target.value})}
                >
                  <option>2023-24</option>
                  <option>2024-25</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.month}
                  onChange={e => setFormData({...formData, month: e.target.value})}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Files (Multiple allowed)</label>
                <input 
                  type="file" 
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
              </div>

              {selectedFileList.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Selected for upload ({selectedFileList.length})</p>
                  {selectedFileList.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                      <span className="truncate pr-4">{f.name}</span>
                      <button 
                        type="button"
                        onClick={() => removeFileFromBatch(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note for CA</label>
                <textarea 
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="Additional instructions..."
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={isUploading || selectedFileList.length === 0}
                className={`w-full py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${isUploading || selectedFileList.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'}`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Submit ${selectedFileList.length > 0 ? selectedFileList.length : ''} Reports`
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <h2 className="font-bold text-slate-900 text-lg">Your Submission History</h2>
              <p className="text-sm text-slate-500">Track status and feedback from your accountant</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">File / Period</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">CA Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {files.length > 0 ? (
                     [...files].reverse().map(file => (
                       <tr key={file.id} className="hover:bg-slate-50 transition">
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="font-semibold text-slate-700">{file.fileName}</span>
                             <span className="text-xs text-slate-500">{file.month} {file.financialYear} • {file.uploadedAt}</span>
                             {file.note && <span className="text-[10px] text-slate-400 italic mt-1 truncate max-w-xs">Note: {file.note}</span>}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight
                              ${file.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                file.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 
                                file.status === 'Error' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'}
                            `}>
                              {file.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                           {file.status === 'Completed' ? (
                             <button className="text-blue-600 hover:underline text-xs font-bold">Download Processed Copy</button>
                           ) : (
                             <span className="text-slate-400 text-xs italic">
                               {file.status === 'Error' ? 'Review feedback' : 'Awaiting completion'}
                             </span>
                           )}
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={3} className="px-6 py-20 text-center text-slate-300 italic">
                         No files uploaded yet.
                       </td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
