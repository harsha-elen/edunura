import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import CourseCategories from './pages/CourseCategories';
import CreateCourseCategory from './pages/CreateCourseCategory';
import EditCourseCategory from './pages/EditCourseCategory';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AdminLayout from './components/AdminLayout';
import { ThemeProvider } from './context/ThemeContext';

const LiveClassSession = React.lazy(() => import('./pages/LiveClassSession'));
const StandaloneLiveClass = React.lazy(() => import('./pages/StandaloneLiveClass'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const userData = JSON.parse(user);
    // Allow both admin and moderator roles
    if (userData.role !== 'admin' && userData.role !== 'moderator') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
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
                    <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="courses" element={<Courses />} />
                        <Route path="courses/create" element={<CourseDetails />} />
                        <Route path="courses/edit/:id" element={<CourseDetails />} />
                        <Route path="categories" element={<CourseCategories />} />
                        <Route path="categories/create" element={<CreateCourseCategory />} />
                        <Route path="categories/edit/:id" element={<EditCourseCategory />} />
                        <Route path="teachers" element={<Teachers />} />
                        <Route path="students" element={<Students />} />
                        <Route path="users" element={<Users />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="live-class/:meetingId" element={
                            <React.Suspense fallback={<div>Loading...</div>}>
                                <LiveClassSession />
                            </React.Suspense>
                        } />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
