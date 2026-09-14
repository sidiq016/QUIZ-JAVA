import { User, QuizModule, QuizResult } from '../types';

let usersCache: User[] = [];
let modulesCache: QuizModule[] = [];
let resultsCache: QuizResult[] = [];

// Helper to safely parse
const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

// Initialize cache from localStorage immediately to avoid UI flickering
usersCache = getStorage<User[]>('javas_users', []);
modulesCache = getStorage<QuizModule[]>('javas_modules', []);
resultsCache = getStorage<QuizResult[]>('javas_results', []);

const syncFromServer = async () => {
  try {
    const [uRes, mRes, rRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/modules'),
      fetch('/api/results')
    ]);
    const uData = await uRes.json();
    const mData = await mRes.json();
    const rData = await rRes.json();
    
    // Only update cache if server returned data
    if (uData && uData.users) usersCache = uData.users;
    if (mData && mData.modules) modulesCache = mData.modules;
    if (rData && rData.results) resultsCache = rData.results;
    
    // Backup to localStorage
    localStorage.setItem('javas_users', JSON.stringify(usersCache));
    localStorage.setItem('javas_modules', JSON.stringify(modulesCache));
    localStorage.setItem('javas_results', JSON.stringify(resultsCache));
  } catch (e) {
    // If offline, just rely on the existing cache which is backed by localStorage
    console.error('Failed to sync from server', e);
  }
};

// Polling for real-time updates
setInterval(syncFromServer, 1000);
setTimeout(syncFromServer, 0); // initial fetch

export const getUsers = (): User[] => [...usersCache];
export const saveUser = (user: User) => {
  const existing = usersCache.findIndex(u => u.id === user.id);
  if (existing >= 0) {
    usersCache[existing] = { ...usersCache[existing], ...user };
  } else {
    usersCache.push(user);
  }
  localStorage.setItem('javas_users', JSON.stringify(usersCache));
  
  fetch('/api/users-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).catch(console.error);
};
export const deleteUser = (id: string) => {
  usersCache = usersCache.filter(u => u.id !== id);
  localStorage.setItem('javas_users', JSON.stringify(usersCache));
  fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(console.error);
}

export const getModules = (): QuizModule[] => [...modulesCache];
export const saveModule = (module: QuizModule) => {
  const existing = modulesCache.findIndex(m => m.id === module.id);
  if (existing >= 0) {
    modulesCache[existing] = module;
  } else {
    modulesCache.push(module);
  }
  localStorage.setItem('javas_modules', JSON.stringify(modulesCache));
  
  fetch('/api/modules-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module)
  }).catch(console.error);
};
export const deleteModule = (id: string) => {
  modulesCache = modulesCache.filter(m => m.id !== id);
  localStorage.setItem('javas_modules', JSON.stringify(modulesCache));
  fetch(`/api/modules/${id}`, { method: 'DELETE' }).catch(console.error);
};

export const getResults = (): QuizResult[] => [...resultsCache];
export const saveResult = (result: QuizResult) => {
  const existing = resultsCache.findIndex(r => r.id === result.id);
  if (existing >= 0) {
    resultsCache[existing] = result;
  } else {
    resultsCache.push(result);
  }
  localStorage.setItem('javas_results', JSON.stringify(resultsCache));
  
  fetch('/api/results-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  }).catch(console.error);
};
export const deleteResult = (id: string) => {
  resultsCache = resultsCache.filter(r => r.id !== id);
  localStorage.setItem('javas_results', JSON.stringify(resultsCache));
  fetch(`/api/results/${id}`, { method: 'DELETE' }).catch(console.error);
};
