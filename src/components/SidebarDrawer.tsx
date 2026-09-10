import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Save, Users, Settings } from 'lucide-react';
import { User } from '../types';
import { saveUser } from '../lib/localDb';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updated: User) => void;
  allUsers?: User[];
}

export default function SidebarDrawer({ isOpen, onClose, user, onUpdateUser, allUsers = [] }: Props) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ ...user });
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserFormData, setEditingUserFormData] = useState<Partial<User>>({});

  // Seed strings for DiceBear avatars
  const avatarOptions = [
    'Felix', 'Aneka', 'Jasper', 'Mimi', 'Max', 'Luna', 'Sasha', 'Jack', 'Oliver', 'Bella'
  ];

  const handleSave = async () => {
    try {
      saveUser({ ...user, ...formData } as User);
      onUpdateUser({ ...user, ...formData } as User);
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminSaveUser = async (targetUserId: string) => {
    try {
      saveUser(editingUserFormData as User);
      setEditingUserId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const currentAvatarUrl = user.avatar 
    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.avatar}` 
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`;
    
  const editAvatarUrl = formData.avatar 
    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.avatar}`
    : currentAvatarUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Background effects */}
            <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Pengaturan
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 relative z-10">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Profil & Karakter
                </h3>
                
                <div className="flex flex-col items-center bg-white/5 border border-white/10 p-6 rounded-3xl mb-6 relative group overflow-hidden">
                   <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 p-1 mb-4 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                     <img src={editing ? editAvatarUrl : currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   
                   {editing ? (
                     <div className="w-full space-y-4">
                       <div>
                         <label className="block text-xs font-bold text-slate-400 mb-2">Pilih Karakter</label>
                         <div className="grid grid-cols-5 gap-2">
                           {avatarOptions.map(seed => (
                             <div 
                               key={seed} 
                               onClick={() => setFormData({...formData, avatar: seed})}
                               className={`cursor-pointer rounded-xl p-1 border-2 transition-all ${formData.avatar === seed ? 'border-blue-500 bg-blue-500/20' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                             >
                               <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`} alt={seed} className="w-full h-auto" />
                             </div>
                           ))}
                         </div>
                       </div>
                       
                       <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">Nama</label>
                         <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 focus:border-blue-500 outline-none text-white text-sm" />
                       </div>
                       
                       {user.role === 'mahasiswa' && (
                         <>
                           <div>
                             <label className="block text-xs font-bold text-slate-400 mb-1">NIM</label>
                             <input type="text" value={formData.nim || ''} onChange={e => setFormData({...formData, nim: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 focus:border-blue-500 outline-none text-white text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-slate-400 mb-1">Kelas</label>
                             <input type="text" value={formData.kelas || ''} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 focus:border-blue-500 outline-none text-white text-sm" />
                           </div>
                         </>
                       )}
                       
                       <div className="flex gap-2 pt-2">
                         <button onClick={() => setEditing(false)} className="flex-1 py-2 bg-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-colors">Batal</button>
                         <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-1">
                           <Save className="w-3 h-3" /> Simpan
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <h4 className="text-lg font-bold text-white">{user.name || 'Nama Belum Diatur'}</h4>
                       <p className="text-blue-400 text-sm font-medium capitalize mb-2">{user.role}</p>
                       {user.role === 'mahasiswa' && (
                         <div className="text-xs text-slate-400 flex flex-col gap-1">
                           <span>NIM: {user.nim}</span>
                           <span>Kelas: {user.kelas}</span>
                         </div>
                       )}
                       <button onClick={() => setEditing(true)} className="mt-4 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors border border-white/10">
                         Edit Profil
                       </button>
                     </div>
                   )}
                </div>
              </div>

              {user.role === 'admin' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Data Pengguna
                  </h3>
                  <div className="space-y-3">
                    {allUsers.map(u => (
                      <div key={u.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col gap-3 group transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                            <img src={u.avatar ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`} alt="avatar" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white truncate">{u.name || u.username}</div>
                            <div className="text-xs text-slate-400 capitalize">{u.role}</div>
                          </div>
                          <button 
                            onClick={() => {
                              if (editingUserId === u.id) {
                                setEditingUserId(null);
                              } else {
                                setEditingUserId(u.id);
                                setEditingUserFormData(u);
                              }
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/10"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {editingUserId === u.id && (
                          <div className="pt-3 border-t border-white/10 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama</label>
                              <input type="text" value={editingUserFormData.name || ''} onChange={e => setEditingUserFormData({...editingUserFormData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-blue-500 outline-none text-white text-xs" />
                            </div>
                            {u.role === 'mahasiswa' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">NIM</label>
                                  <input type="text" value={editingUserFormData.nim || ''} onChange={e => setEditingUserFormData({...editingUserFormData, nim: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-blue-500 outline-none text-white text-xs" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Kelas</label>
                                  <input type="text" value={editingUserFormData.kelas || ''} onChange={e => setEditingUserFormData({...editingUserFormData, kelas: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-blue-500 outline-none text-white text-xs" />
                                </div>
                              </>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => handleAdminSaveUser(u.id)} className="flex-1 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 transition-colors">
                                Simpan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
