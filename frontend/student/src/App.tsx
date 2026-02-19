import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CssBaseline } from '@mui/material';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import StudentLayout from './components/StudentLayout';
import MyCourses from './pages/MyCourses';
import Checkout from './pages/Checkout';
import CoursePlayer from './pages/CoursePlayer';
import LiveSessions from './pages/LiveSessions';
import PurchaseSuccess from './pages/PurchaseSuccess';
import Calendar from './pages/Calendar';
import Help from './pages/Help';

// Protected Route Component for Student Portal
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    try {
        const userData = JSON.parse(user);
        // Only allow student role
        if (userData.role !== 'student') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return <Navigate to="/login" replace />;
        }
        return <>{children}</>;
    } catch (error) {
        // Invalid user data in localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <CssBaseline />
            <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="my-courses" element={<MyCourses />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="calendar" element={<Calendar />} />
                        <Route path="live-sessions" element={<LiveSessions />} />
                        <Route path="help" element={<Help />} />
                        <Route path="settings" element={<Profile />} />
                        <Route index element={<Navigate to="/dashboard" replace />} />
                    </Route>

                    {/* Standalone Protected Routes (Custom Layout) */}
                    <Route path="/course/:courseId/player/:lessonId" element={
                        <ProtectedRoute>
                            <CoursePlayer />
                        </ProtectedRoute>
                    } />

                    <Route path="/course/:courseId/learn" element={
                        <ProtectedRoute>
                            <CoursePlayer />
                        </ProtectedRoute>
                    } />

                    <Route path="/checkout/:courseId" element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    } />
                    <Route path="/purchase-success/:courseId" element={
                        <ProtectedRoute>
                            <PurchaseSuccess />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
};

export default App;
