import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';

export function RootLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15)',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}