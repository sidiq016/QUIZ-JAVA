import { User, QuizModule, QuizResult } from '../types';

export const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const setStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getUsers = (): User[] => getStorage<User[]>('javas_users', []);
export const saveUser = (user: User) => {
  const users = getUsers();
  const existing = users.findIndex(u => u.id === user.id);
  if (existing >= 0) {
    users[existing] = { ...users[existing], ...user };
  } else {
    users.push(user);
  }
  setStorage('javas_users', users);
};
export const deleteUser = (id: string) => {
  const users = getUsers();
  setStorage('javas_users', users.filter(u => u.id !== id));
}

export const getModules = (): QuizModule[] => getStorage<QuizModule[]>('javas_modules', []);
export const saveModule = (module: QuizModule) => {
  const modules = getModules();
  const existing = modules.findIndex(m => m.id === module.id);
  if (existing >= 0) {
    modules[existing] = module;
  } else {
    modules.push(module);
  }
  setStorage('javas_modules', modules);
};
export const deleteModule = (id: string) => {
  const modules = getModules();
  setStorage('javas_modules', modules.filter(m => m.id !== id));
};

export const getResults = (): QuizResult[] => getStorage<QuizResult[]>('javas_results', []);
export const saveResult = (result: QuizResult) => {
  const results = getResults();
  results.push(result);
  setStorage('javas_results', results);
};
export const deleteResult = (id: string) => {
  const results = getResults();
  setStorage('javas_results', results.filter(r => r.id !== id));
};
