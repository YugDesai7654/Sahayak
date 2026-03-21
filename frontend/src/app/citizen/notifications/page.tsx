'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { notificationApi, suggestionApi } from '@/lib/api';

interface Notification {
  notification_id: string;
  title: string;
  body: string;
  type: string;
  scheme_id: string | null;
  is_read: boolean;
  priority: string;
  suggestion_score: number | null;
  match_reasons: string[];
  created_at: string;
}

export default function NotificationsPage() {
  const { user, lang } = useAuthStore();
  const authHydrated = useAuthHydrated();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user || user.role !== 'citizen') { router.push('/citizen/auth/login'); return; }
    loadNotifications();
  }, [user, filter, authHydrated]);

  async function loadNotifications() {
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter === 'unread') params.unread_only = 'true';
      if (filter !== 'all' && filter !== 'unread') params.type = filter;
      const res = await notificationApi.list(params);
      setNotifications(res.notifications || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshSuggestions() {
    setRefreshing(true);
    try {
      await suggestionApi.refresh();
      await loadNotifications();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  }

  async function handleDismiss(id: string) {
    try {
      await notificationApi.dismiss(id);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
      setTotal(t => t - 1);
    } catch {}
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const priorityColors: Record<string, string> = {
    high: 'border-l-green-500 bg-green-50/50',
    medium: 'border-l-blue-500 bg-blue-50/30',
    low: 'border-l-gray-300 bg-white',
  };

  if (!authHydrated || loading) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />

      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/citizen/dashboard" className="text-gray-500 hover:text-primary text-lg">←</Link>
            <h1 className="font-bold text-lg text-gray-900">🔔 {t('Notifications', 'सूचनाएं')}</h1>
            {total > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{total}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshSuggestions}
              disabled={refreshing}
              className="text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {refreshing ? '⏳' : '🤖'} {t('Refresh AI', 'AI रिफ्रेश')}
            </button>
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-medium text-gray-500 hover:text-primary hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
            >
              ✓ {t('Read All', 'सभी पढ़ें')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6 page-enter">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: t('All', 'सभी') },
            { key: 'unread', label: t('Unread', 'अपठित') },
            { key: 'scheme_suggestion', label: t('🎯 Suggestions', '🎯 सुझाव') },
            { key: 'deadline_reminder', label: t('⏰ Reminders', '⏰ रिमाइंडर') },
            { key: 'status_update', label: t('📋 Updates', '📋 अपडेट') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setLoading(true); }}
              className={`whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full transition ${
                filter === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔕</p>
            <p className="text-gray-500 text-lg">{t('No notifications yet', 'कोई सूचना नहीं')}</p>
            <button
              onClick={handleRefreshSuggestions}
              disabled={refreshing}
              className="mt-4 btn-primary text-sm disabled:opacity-50"
            >
              {refreshing ? 'Generating...' : '🤖 Generate AI Suggestions'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.notification_id}
                className={`rounded-xl border-l-4 p-4 transition-all hover:shadow-sm ${
                  priorityColors[n.priority] || priorityColors.medium
                } ${!n.is_read ? 'ring-1 ring-primary/20' : 'opacity-80'}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                      <h3 className={`text-sm font-semibold text-gray-900 truncate ${!n.is_read ? '' : 'text-gray-600'}`}>
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{n.body}</p>

                    {/* Match reasons */}
                    {n.match_reasons && n.match_reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {n.match_reasons.slice(0, 3).map((reason, i) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            💡 {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Score + Time */}
                    <div className="flex items-center gap-3 mt-2">
                      {n.suggestion_score != null && n.suggestion_score > 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {Math.round(n.suggestion_score * 100)}% match
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.scheme_id && (
                      <Link
                        href={`/citizen/schemes/${n.scheme_id}`}
                        className="text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition"
                      >
                        View →
                      </Link>
                    )}
                    {!n.is_read && (
                      <button onClick={() => handleMarkRead(n.notification_id)} className="text-xs text-gray-400 hover:text-gray-600 p-1" title="Mark read">
                        ✓
                      </button>
                    )}
                    <button onClick={() => handleDismiss(n.notification_id)} className="text-xs text-gray-400 hover:text-red-500 p-1" title="Dismiss">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
