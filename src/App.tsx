import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/utils/auth";
import { testSupabaseConnection } from '@/lib/supabase';
import { initializeData } from "@/utils/initData";
import Footer from "@/components/Footer";
import { routes, LoadingSpinner } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Initialize data when the app starts
initializeData();

const AppRoutes = () => {
  const element = useRoutes(routes);
  return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>;
};

const App = () => {
  useEffect(() => {
    // Test Supabase connection on app load
    testSupabaseConnection();
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <AppRoutes />
                <div className="hidden md:block">
                <Footer />
                </div>
              </div>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
