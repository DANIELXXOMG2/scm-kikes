'use client';

import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-secondary flex items-center justify-end px-6 border-b border-accent/20">
      {user && (
        <div className="text-sm">
          Usuario: <span className="font-medium">{user.email}</span>
        </div>
      )}
    </header>
  );
}
