'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authApi } from '@/lib/auth';

const navigation = [
  { name: 'Дашборд', href: '/', icon: '📊' },
  { name: 'Аналитика', href: '/analytics', icon: '📈' },
  { name: 'Когорты', href: '/analytics/cohorts', icon: '👥' },
  { name: 'Рынки', href: '/markets', icon: '🎯' },
  { name: 'Разрешения', href: '/resolutions', icon: '⚖️' },
  { name: 'Категории', href: '/categories', icon: '📁' },
  { name: 'Каналы', href: '/channels', icon: '📢' },
  { name: 'Посты', href: '/posts', icon: '✍️' },
  { name: 'Выплаты', href: '/payouts', icon: '💰' },
  { name: 'Безопасность', href: '/security', icon: '🔒' },
  { name: 'Аудит-логи', href: '/audit-logs', icon: '📋' },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    authApi.logout();
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Админ панель</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

