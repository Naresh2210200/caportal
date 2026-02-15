
import { User, UploadedFile, ProcessingLog } from '../types';

const USERS_KEY = 'ca_app_users';
const FILES_KEY = 'ca_app_files';
const LOGS_KEY = 'ca_app_logs';

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  saveUser: (user: User) => {
    const users = db.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  findUserByUsername: (username: string) => db.getUsers().find(u => u.username === username),
  findCAByCode: (code: string) => db.getUsers().find(u => u.role === 'ca' && u.caCode === code),
  
  getFiles: (): UploadedFile[] => JSON.parse(localStorage.getItem(FILES_KEY) || '[]'),
  saveFile: (file: UploadedFile) => {
    const files = db.getFiles();
    files.push(file);
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
  },
  updateFileStatus: (id: string, status: UploadedFile['status']) => {
    const files = db.getFiles();
    const idx = files.findIndex(f => f.id === id);
    if (idx !== -1) {
      files[idx].status = status;
      localStorage.setItem(FILES_KEY, JSON.stringify(files));
    }
  },

  getLogs: (): ProcessingLog[] => JSON.parse(localStorage.getItem(LOGS_KEY) || '[]'),
  saveLog: (log: ProcessingLog) => {
    const logs = db.getLogs();
    logs.push(log);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
};
