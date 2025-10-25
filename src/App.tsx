import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { FontSizeProvider } from "@/components/font-size-provider";
import { AuthProvider } from "@/utils/auth";
import { testSupabaseConnection } from '@/lib/supabase';
import { initializeData } from "@/utils/initData";
import { initializeSessionManager } from "@/utils/sessionManager";
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
    
    // Initialize session management
    initializeSessionManager(
      () => {
        // Session expired callback
        console.log('Session expired - redirecting to login');
        window.location.href = '/login';
      },
      () => {
        // Session warning callback
        console.log('Session expiring soon - warning shown');
      }
    );
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <FontSizeProvider defaultFontSize="default">
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
      </FontSizeProvider>
    </ThemeProvider>
  );
};

export default App;
