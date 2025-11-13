'use client';

import { signOut } from 'firebase/auth';
import {
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { auth } from '@/lib/firebase';

// (RF-M1 a M6)
const navItems = [
  { name: 'Inventario', href: '/app', icon: LayoutDashboard },
  { name: 'Clientes', href: '/app/clientes', icon: Users },
  { name: 'Proveedores', href: '/app/proveedores', icon: Truck },
  { name: 'Ventas', href: '/app/ventas', icon: ShoppingCart },
  { name: 'Compras', href: '/app/compras', icon: ClipboardList },
  { name: 'Saldo en Caja', href: '/app/saldo', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Eliminar la cookie (RF-M0)
      document.cookie = 'firebaseAuthToken=; path=/; max-age=0';
      toast.success('Sesión cerrada.');
      router.push('/login');
    } catch {
      toast.error('Error al cerrar sesión.');
    }
  };

  return (
    <aside className="w-64 bg-secondary text-text-dark flex flex-col border-r border-accent/20">
      <div className="h-20 flex items-center justify-center border-b border-accent/20 px-3">
        <Image
          src="/assets/logos/LOGO-KIKES.avif"
          alt="Huevos Kikes"
          width={70}
          height={70}
          priority
          className="object-contain"
        />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center space-x-3 px-4 py-2 rounded-md transition-colors
              ${pathname === item.href 
                ? 'bg-accent/30 text-accent-foreground font-medium' 
                : 'hover:bg-accent/10'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-accent/20">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-2 rounded-md w-full text-left hover:bg-danger/20 text-danger"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
