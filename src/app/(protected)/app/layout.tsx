import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-base text-text-dark">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="p-6 overflow-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}
