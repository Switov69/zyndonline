import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Search,
  Edit3,
  Ban,
  CheckCircle2,
  X,
  Save,
  Camera,
  Trash2,
  Unlock,
  Send,
  CreditCard,
  Clock,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { User, PaymentRequest } from '../types';

export default function Admin() {
  const { isAdmin, getAllUsers, adminUpdateUser, adminSetBlocked, getPaymentRequests, approvePayment, rejectPayment } = useAuth();
  const { jobs, cancelJobTake, deleteJob, completeJob, updateJob } = useJobs();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<(User & { password?: string }) | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    setPaymentRequests(getPaymentRequests());
    const handler = () => setPaymentRequests(getPaymentRequests());
    window.addEventListener('zynd_payments_updated', handler);
    return () => window.removeEventListener('zynd_payments_updated', handler);
  }, [getPaymentRequests]);

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const allUsers = getAllUsers();
  const filteredUsers = allUsers.filter((u: any) =>
    !searchQuery ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.telegram?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditTelegram(u.telegram || '');
    setEditPassword('');
  };

  const saveUserEdit = () => {
    if (!editingUser) return;
    const data: any = {};
    if (editUsername.trim() && editUsername.trim() !== editingUser.username) {
      data.username = editUsername.trim();
    }
    if (editTelegram.trim() !== (editingUser.telegram || '')) {
      data.telegram = editTelegram.trim();
    }
    if (editPassword) {
      data.password = editPassword;
    }
    if (Object.keys(data).length > 0) {
      adminUpdateUser(editingUser.id, data);
      showMsg(`Пользователь ${editingUser.username} обновлён`);
    }
    setEditingUser(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      adminUpdateUser(editingUser.id, { avatar: reader.result as string });
      setEditingUser({ ...editingUser, avatar: reader.result as string });
      showMsg('Аватарка обновлена');
    };
    reader.readAsDataURL(file);
  };

  const toggleBlock = (userId: string, currentBlocked: boolean) => {
    adminSetBlocked(userId, !currentBlocked);
    showMsg(currentBlocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
  };

  const getUserJobs = (userId: string) => jobs.filter(j => j.authorId === userId);
  const getUserTakenJobs = (userId: string) => jobs.filter(j => j.takenById === userId);

  const handleCancelJobTake = (jobId: string) => {
    cancelJobTake(jobId);
    showMsg('Заказ отменён у исполнителя');
  };

  const handleDeleteJob = (jobId: string) => {
    deleteJob(jobId);
    showMsg('Заказ удалён');
  };

  const handleCompleteJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      updateJob(jobId, {
        status: 'done',
        executorId: job.takenById,
        executorName: job.takenByName,
      });
    }
    showMsg('Заказ завершён');
  };

  const handleApprovePayment = (requestId: string) => {
    approvePayment(requestId);
    setPaymentRequests(getPaymentRequests());
    showMsg('Подписка активирована!');
  };

  const handleRejectPayment = (requestId: string) => {
    rejectPayment(requestId);
    setPaymentRequests(getPaymentRequests());
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
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Users size={15} />
          Пользователи ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'payments' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <CreditCard size={15} />
          Оплата
          {pendingPayments.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <>
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по никнейму, telegram или ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800/60 border border-dark-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-dark-400" />
            <h2 className="text-white font-semibold">Пользователи ({filteredUsers.length})</h2>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((u: any) => {
              const userJobs = getUserJobs(u.id);
              const userTakenJobs = getUserTakenJobs(u.id);
              const hasPremium = u.subscription?.active && u.subscription?.expiresAt && new Date(u.subscription.expiresAt) > new Date();
              return (
                <div key={u.id} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center text-dark-200 text-lg font-bold overflow-hidden">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{u.username}</h3>
                        {u.isAdmin && (
                          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">Admin</span>
                        )}
                        {hasPremium && (
                          <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                            <Crown size={10} /> Premium
                          </span>
                        )}
                        {u.blocked && (
                          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">Заблокирован</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
                        <span className="text-xs">ID: {u.id}</span>
                        {u.telegram && (
                          <span className="flex items-center gap-1 text-xs">
                            <Send size={12} />
                            {u.telegram}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-dark-500 mt-1">
                        <span>Заказов: {userJobs.length}</span>
                        <span>Взято: {userTakenJobs.length}</span>
                        <span>С {u.joinedAt}</span>
                        {u.rating?.count > 0 && (
                          <span>Рейтинг: {(u.rating.total / u.rating.count).toFixed(1)} ({u.rating.count})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => startEditUser(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-xs font-medium transition-colors border border-dark-600/50"
                      >
                        <Edit3 size={13} />
                        Изменить
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => toggleBlock(u.id, u.blocked)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                            u.blocked
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                          }`}
                        >
                          {u.blocked ? <Unlock size={13} /> : <Ban size={13} />}
                          {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      )}
                    </div>
                  </div>

                  {(userJobs.length > 0 || userTakenJobs.length > 0) && (
                    <UserJobsList
                      userJobs={userJobs}
                      userTakenJobs={userTakenJobs}
                      onCancelTake={handleCancelJobTake}
                      onDelete={handleDeleteJob}
                      onComplete={handleCompleteJob}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {paymentRequests.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} className="text-dark-500" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Нет запросов на оплату</h3>
              <p className="text-dark-400 text-sm">Запросы появятся здесь, когда пользователи оплатят Premium</p>
            </div>
          )}

          {pendingPayments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-amber-400" />
                <h3 className="text-white font-semibold">Ожидают проверки ({pendingPayments.length})</h3>
              </div>
              <div className="space-y-3">
                {pendingPayments.map((req) => (
                  <div key={req.id} className="bg-dark-800/50 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crown size={15} className="text-purple-400" />
                          <span className="text-white font-semibold">{req.username}</span>
                          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">Ожидает</span>
                        </div>
                        <p className="text-dark-400 text-xs">ID: {req.userId}</p>
                        <p className="text-dark-500 text-xs">
                          Запрос: {new Date(req.requestedAt).toLocaleString('ru')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectPayment(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
                        >
                          <X size={13} />
                          Отклонить
                        </button>
                        <button
                          onClick={() => handleApprovePayment(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-medium transition-colors"
                        >
                          <Crown size={13} />
                          Подтвердить
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
                  <div key={req.id} className="bg-dark-800/30 border border-dark-700/30 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-white text-sm font-medium">{req.username}</span>
                      <p className="text-dark-500 text-xs">{new Date(req.requestedAt).toLocaleDateString('ru')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
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
              <button onClick={() => setEditingUser(null)} className="text-dark-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-center mb-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-2xl font-bold overflow-hidden border-2 border-dark-500/50">
                  {editingUser.avatar ? (
                    <img src={editingUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    editingUser.username.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-dark-400 text-xs mb-1">Никнейм</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-dark-400 text-xs mb-1">Telegram</label>
                <input
                  type="text"
                  value={editTelegram}
                  onChange={(e) => setEditTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-dark-400 text-xs mb-1">Новый пароль <span className="text-dark-600">(оставьте пустым, чтобы не менять)</span></label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Новый пароль"
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={saveUserEdit}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Save size={16} />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserJobsList({
  userJobs,
  userTakenJobs,
  onCancelTake,
  onDelete,
  onComplete,
}: {
  userJobs: any[];
  userTakenJobs: any[];
  onCancelTake: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-4 text-xs text-dark-400 hover:text-dark-200 transition-colors"
      >
        Показать заказы ({userJobs.length} создано, {userTakenJobs.length} взято) →
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-dark-700/50 space-y-3">
      <button onClick={() => setExpanded(false)} className="text-xs text-dark-400 hover:text-dark-200 transition-colors">
        Скрыть заказы ←
      </button>

      {userJobs.length > 0 && (
        <div>
          <p className="text-dark-400 text-xs font-medium mb-2">Созданные заказы:</p>
          <div className="space-y-2">
            {userJobs.map((job) => (
              <div key={job.id} className="bg-dark-700/30 rounded-xl p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{job.title}</p>
                  <p className="text-dark-500 text-xs">
                    {job.status === 'open' ? 'Открыт' : job.status === 'in_progress' ? 'В работе' : 'Завершён'}
                    {job.takenByName && ` · Исполнитель: ${job.takenByName}`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {job.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => onCancelTake(job.id)}
                        className="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-amber-500/25"
                      >
                        Снять исп.
                      </button>
                      <button
                        onClick={() => onComplete(job.id)}
                        className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-emerald-500/25"
                      >
                        Завершить
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onDelete(job.id)}
                    className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userTakenJobs.length > 0 && (
        <div>
          <p className="text-dark-400 text-xs font-medium mb-2">Взятые заказы:</p>
          <div className="space-y-2">
            {userTakenJobs.map((job) => (
              <div key={job.id} className="bg-dark-700/30 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{job.title}</p>
                  <p className="text-dark-500 text-xs">Заказчик: {job.authorName}</p>
                </div>
                <button
                  onClick={() => onCancelTake(job.id)}
                  className="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-amber-500/25"
                >
                  Отменить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
