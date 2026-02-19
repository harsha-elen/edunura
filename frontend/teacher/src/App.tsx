import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import ManageCourse from './pages/ManageCourse';
import Calendar from './pages/Calendar';
import LiveClasses from './pages/LiveClasses';
import Profile from './pages/Profile';
import TeacherLayout from './components/TeacherLayout';

const StandaloneLiveClass = React.lazy(() => import('./pages/StandaloneLiveClass'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'teacher') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Standalone Live Class - No sidebar, full screen */}
                    <Route path="/meeting/:meetingId" element={
                        <React.Suspense fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#1a1a1a' }}>
                                <CircularProgress sx={{ color: 'white' }} />
                            </Box>
                        }>
                            <StandaloneLiveClass />
                        </React.Suspense>
                    } />

                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><TeacherLayout /></ProtectedRoute>}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="courses" element={<Courses />} />
                        <Route path="courses/:id/manage" element={<ManageCourse />} />
                        <Route path="courses/:id/manage" element={<ManageCourse />} />
                        <Route path="calendar" element={<Calendar />} />
                        <Route path="live-classes" element={<LiveClasses />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
};

export default App;
