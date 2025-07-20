
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { TaskZenIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutGrid, ListTodo, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


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
         <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Responsive Header */}
            <header className="flex h-16 items-center justify-between px-4 md:px-6 border-b shrink-0">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <TaskZenIcon />
                    <span className="text-lg">TaskZen</span>
                </Link>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-4">
                     <Button variant="ghost" asChild>
                         <Link href="/tasks">
                             <ListTodo className="h-5 w-5 mr-2" />
                             Tasks
                         </Link>
                     </Button>
                     <Button variant="ghost" asChild>
                         <Link href="/">
                             <LayoutGrid className="h-5 w-5 mr-2" />
                             Dashboard
                         </Link>
                     </Button>
                </nav>
                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Menu className="h-6 w-6" />
                          <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right">
                        <SheetHeader>
                           <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        </SheetHeader>
                        <div className="grid gap-4 p-4">
                            <Link href="/" className="flex items-center gap-2 font-semibold mb-4">
                                <TaskZenIcon />
                                <span className="text-lg">TaskZen</span>
                            </Link>
                            <nav className="grid gap-2">
                                <Button variant="ghost" className="justify-start" asChild>
                                     <Link href="/tasks">
                                         <ListTodo className="h-5 w-5 mr-2" />
                                         Tasks
                                     </Link>
                                 </Button>
                                 <Button variant="ghost" className="justify-start" asChild>
                                     <Link href="/">
                                         <LayoutGrid className="h-5 w-5 mr-2" />
                                         Dashboard
                                     </Link>
                                 </Button>
                            </nav>
                        </div>
                      </SheetContent>
                    </Sheet>
                </div>
            </header>

            <div className="flex-1 flex overflow-y-auto hide-scrollbar">
                {children}
            </div>
         </div>
        <Toaster />
      </body>
    </html>
  );
}
