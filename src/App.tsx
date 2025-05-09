
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, ProtectedRoute, PublicRoute } from "@/utils/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Complaint from "./pages/Complaint";
import ComplaintList from "./pages/ComplaintList";
import Helper from "./pages/Helper";
import Student from "./pages/Student";
import RideBooking from "./pages/RideBooking";
import ConfirmationLogs from "./pages/ConfirmationLogs";
import Footer from "./components/Footer";
import Messages from "@/pages/Messages";
import Driver from "@/pages/Driver";
import { testSupabaseConnection } from '@/lib/supabase';
import { initializeData } from "@/utils/initData";

const queryClient = new QueryClient();

// Initialize data when the app starts
initializeData();

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
                <Routes>
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  
                  {/* Admin only routes */}
                  <Route path="/register" element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <Register />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/confirmation-logs" element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <ConfirmationLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/complaint/list" element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <ComplaintList />
                    </ProtectedRoute>
                  } />
                  
                  {/* Helper only routes */}
                  <Route path="/helper" element={
                    <ProtectedRoute requiredRoles={["helper"]}>
                      <Helper />
                    </ProtectedRoute>
                  } />
                  
                  {/* Student only routes */}
                  <Route path="/student" element={
                    <ProtectedRoute requiredRoles={["student"]}>
                      <Student />
                    </ProtectedRoute>
                  } />
                  
                  {/* Driver only routes */}
                  <Route path="/driver" element={
                    <ProtectedRoute requiredRoles={["driver"]}>
                      <Driver />
                    </ProtectedRoute>
                  } />
                  
                  {/* Shared routes */}
                  <Route path="/complaint" element={
                    <ProtectedRoute>
                      <Complaint />
                    </ProtectedRoute>
                  } />
                  <Route path="/book-ride" element={
                    <ProtectedRoute>
                      <RideBooking />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
