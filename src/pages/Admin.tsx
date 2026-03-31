import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Search, Edit3, Ban, CheckCircle2, X,
  Save, Camera, Trash2, Unlock, Send, CreditCard, Clock, Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { User, PaymentRequest } from '../types';

export default function Admin() {
  const { user, isAdmin, getAllUsers, adminUpdateUser, adminSetBlocked, adminDeleteUser,
    getPaymentRequests, approvePayment, rejectPayment, refreshUser } = useAuth();
  const { jobs, cancelJobTake, deleteJob, updateJob } = useJobs();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');
  const [allUsers, setAllUsers] = useState<(User & { password?: string })[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<(User & { password?: string }) | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = useCallback(async () => {
    const users = await getAllUsers();
    setAllUsers(users);
  }, [getAllUsers]);

  const loadPayments = useCallback(async () => {
    const payments = await getPaymentRequests();
    setPaymentRequests(payments);
  }, [getPaymentRequests]);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadUsers();
    loadPayments();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const filteredUsers = allUsers.filter((u) =>
    !searchQuery ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.telegram?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const startEditUser = (u: User & { password?: string }) => {
    setEditingUser(u); setEditUsername(u.username); setEditTelegram(u.telegram || ''); setEditPassword('');
  };

  const saveUserEdit = async () => {
    if (!editingUser || !user) return;
    const data: any = {};
    if (editUsername.trim() && editUsername !== editingUser.username) data.username = editUsername.trim();
    if (editTelegram.trim() !== (editingUser.telegram || '')) data.telegram = editTelegram.trim();
    if (editPassword) data.password = editPassword;
    if (Object.keys(data).length > 0) {
      await adminUpdateUser(editingUser.id, data);
      showMsg(`Пользователь ${editingUser.username} обновлён`);
    }
    setEditingUser(null);
    loadUsers();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await adminUpdateUser(editingUser.id, { avatar: reader.result as string });
      setEditingUser({ ...editingUser, avatar: reader.result as string });
      showMsg('Аватарка обновлена');
      loadUsers();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleBlock = async (u: User) => {
    await adminSetBlocked(u.id, !u.blocked);
    showMsg(u.blocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
    loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    await adminDeleteUser(userId);
    setDeleteConfirmId(null);
    showMsg('Пользователь удалён');
    loadUsers();
  };

  const getUserJobs = (userId: string) => jobs.filter(j => j.authorId === userId);
  const getUserTakenJobs = (userId: string) => jobs.filter(j => j.takenById === userId);

  const handleCompleteJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) await updateJob(jobId, { status: 'done', executorId: job.takenById, executorName: job.takenByName });
    showMsg('Заказ завершён');
  };

  const handleApprovePayment = async (requestId: string) => {
    await approvePayment(requestId);
    await loadPayments();
    // If current admin is viewing — also refresh their user object (edge case)
    showMsg('Подписка активирована!');
  };

  const handleRejectPayment = async (requestId: string) => {
    await rejectPayment(requestId);
    await loadPayments();
    showMsg('Оплата отклонена');
  };

  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const resolvedPayments = paymentRequests.filter(p => p.status !== 'pending');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
          <p className="text-dark-400 text-sm">Управление пользователями, заказами и оплатой</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <CheckCircle2 size={16} />{success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        <button onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
          <Users size={14} /> Пользователи ({allUsers.length})
        </button>
        <button onClick={() => setActiveTab('payments')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
          <CreditCard size={14} /> Оплата
          {pendingPayments.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingPayments.length}</span>
          )}
        </button>
      </div>

      {/* ── Users ── */}
      {activeTab === 'users' && (
        <>
          <div className="relative mb-6">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" placeholder="Поиск по никнейму, telegram или ID..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800/60 border border-dark-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent-500/50 transition-all" />
          </div>

          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const hasPremium = u.subscription?.active && u.subscription?.expiresAt && new Date(u.subscription.expiresAt) > new Date();
              return (
                <div key={u.id} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-11 h-11 rounded-xl bg-dark-600 flex items-center justify-center text-dark-200 text-lg font-bold overflow-hidden shrink-0">
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{u.username}</h3>
                        {u.isAdmin && <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">Admin</span>}
                        {hasPremium && <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"><Crown size={9} />Premium</span>}
                        {u.blocked && <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">Заблокирован</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-dark-500 mt-1 flex-wrap">
                        <span>ID: {u.id}</span>
                        {u.telegram && <span className="flex items-center gap-1"><Send size={11} />{u.telegram}</span>}
                        <span>С {u.joinedAt}</span>
                        {u.rating && u.rating.count > 0 && <span>★ {(u.rating.total / u.rating.count).toFixed(1)} ({u.rating.count})</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap shrink-0">
                      <button onClick={() => startEditUser(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-xs font-medium transition-colors border border-dark-600/50">
                        <Edit3 size={12} /> Изменить
                      </button>
                      {!u.isAdmin && (
                        <>
                          <button onClick={() => handleToggleBlock(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${u.blocked ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'}`}>
                            {u.blocked ? <><Unlock size={12} /> Разблокировать</> : <><Ban size={12} /> Заблокировать</>}
                          </button>
                          {deleteConfirmId === u.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDeleteUser(u.id)}
                                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-medium transition-colors">
                                Удалить!
                              </button>
                              <button onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-2 bg-dark-700 text-dark-300 rounded-xl text-xs font-medium transition-colors">
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(u.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-red-500/15 text-dark-400 hover:text-red-400 rounded-xl text-xs font-medium transition-all border border-dark-600/50 hover:border-red-500/20">
                              <Trash2 size={12} /> Удалить
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(getUserJobs(u.id).length > 0 || getUserTakenJobs(u.id).length > 0) && (
                    <UserJobsList
                      userJobs={getUserJobs(u.id)}
                      userTakenJobs={getUserTakenJobs(u.id)}
                      onCancelTake={async (id) => { await cancelJobTake(id); showMsg('Снят исполнитель'); }}
                      onDelete={async (id) => { await deleteJob(id); showMsg('Заказ удалён'); }}
                      onComplete={handleCompleteJob}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Payments ── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {paymentRequests.length === 0 && (
            <div className="text-center py-16">
              <CreditCard size={36} className="text-dark-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Нет запросов</h3>
              <p className="text-dark-400 text-sm">Запросы на оплату Premium появятся здесь</p>
            </div>
          )}
          {pendingPayments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Clock size={15} className="text-amber-400" /><h3 className="text-white font-semibold">Ожидают ({pendingPayments.length})</h3></div>
              <div className="space-y-3">
                {pendingPayments.map((req) => (
                  <div key={req.id} className="bg-dark-800/50 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crown size={14} className="text-purple-400" />
                          <span className="text-white font-semibold">{req.username}</span>
                          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">Ожидает</span>
                        </div>
                        <p className="text-dark-500 text-xs">{new Date(req.requestedAt).toLocaleString('ru')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectPayment(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors">
                          <X size={12} /> Отклонить
                        </button>
                        <button onClick={() => handleApprovePayment(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-medium transition-colors">
                          <Crown size={12} /> Подтвердить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resolvedPayments.length > 0 && (
            <div>
              <h3 className="text-dark-400 text-sm font-medium mb-3">История ({resolvedPayments.length})</h3>
              <div className="space-y-2">
                {resolvedPayments.map((req) => (
                  <div key={req.id} className="bg-dark-800/30 border border-dark-700/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-white text-sm font-medium">{req.username}</span>
                      <p className="text-dark-500 text-xs">{new Date(req.requestedAt).toLocaleDateString('ru')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {req.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Редактировать пользователя</h3>
              <button onClick={() => setEditingUser(null)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-2xl font-bold overflow-hidden border-2 border-dark-500/50">
                  {editingUser.avatar ? <img src={editingUser.avatar} alt="" className="w-full h-full object-cover" /> : editingUser.username.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={20} className="text-white" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-dark-400 text-xs mb-1">Никнейм</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-dark-400 text-xs mb-1">Telegram</label>
                <input type="text" value={editTelegram} onChange={(e) => setEditTelegram(e.target.value)} placeholder="@username"
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-dark-400 text-xs mb-1">Новый пароль <span className="text-dark-600">(пусто = не менять)</span></label>
                <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Новый пароль"
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={saveUserEdit} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Save size={15} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserJobsList({ userJobs, userTakenJobs, onCancelTake, onDelete, onComplete }: {
  userJobs: any[]; userTakenJobs: any[];
  onCancelTake: (id: string) => void; onDelete: (id: string) => void; onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!expanded) return (
    <button onClick={() => setExpanded(true)} className="mt-3 text-xs text-dark-400 hover:text-dark-200 transition-colors">
      Показать заказы ({userJobs.length} создано, {userTakenJobs.length} взято) →
    </button>
  );
  return (
    <div className="mt-4 pt-4 border-t border-dark-700/50 space-y-3">
      <button onClick={() => setExpanded(false)} className="text-xs text-dark-400 hover:text-dark-200 transition-colors">Скрыть ←</button>
      {userJobs.length > 0 && (
        <div>
          <p className="text-dark-400 text-xs font-medium mb-2">Созданные:</p>
          <div className="space-y-2">
            {userJobs.map((job) => (
              <div key={job.id} className="bg-dark-700/30 rounded-xl p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{job.title}</p>
                  <p className="text-dark-500 text-xs">{job.status === 'open' ? 'Открыт' : job.status === 'in_progress' ? 'В работе' : 'Завершён'}{job.takenByName && ` · ${job.takenByName}`}</p>
                </div>
                <div className="flex gap-1.5">
                  {job.status === 'in_progress' && (
                    <>
                      <button onClick={() => onCancelTake(job.id)} className="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors">Снять исп.</button>
                      <button onClick={() => onComplete(job.id)} className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors">Завершить</button>
                    </>
                  )}
                  <button onClick={() => onDelete(job.id)} className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {userTakenJobs.length > 0 && (
        <div>
          <p className="text-dark-400 text-xs font-medium mb-2">Взятые:</p>
          <div className="space-y-2">
            {userTakenJobs.map((job) => (
              <div key={job.id} className="bg-dark-700/30 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{job.title}</p>
                  <p className="text-dark-500 text-xs">Заказчик: {job.authorName}</p>
                </div>
                <button onClick={() => onCancelTake(job.id)} className="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors">Отменить</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
