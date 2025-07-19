
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TaskZenIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutGrid, ListTodo } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TaskZen',
  description: 'A clean and modern task management application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
         <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-20 hidden md:flex flex-col items-center space-y-4 py-4 border-r bg-card">
                 <Link href="/" className="flex items-center gap-2">
                    <TaskZenIcon />
                 </Link>
                 <nav className="flex flex-col items-center gap-4">
                     <Button variant="ghost" size="icon" asChild>
                         <Link href="/tasks" title="Tasks">
                             <ListTodo className="h-5 w-5" />
                         </Link>
                     </Button>
                     <Button variant="ghost" size="icon" asChild>
                         <Link href="/" title="Dashboard">
                             <LayoutGrid className="h-5 w-5" />
                         </Link>
                     </Button>
                 </nav>
            </aside>
            <div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar">
                {children}
            </div>
         </div>
        <Toaster />
      </body>
    </html>
  );
}
