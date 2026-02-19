import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, TextField,
    Avatar, IconButton, Switch, Grid, useTheme,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Instructor {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface InstructorSectionProps {
    instructors: Instructor[];
    setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
}

const InstructorSection: React.FC<InstructorSectionProps> = ({ instructors, setInstructors }) => {
    const theme = useTheme();
    const [showProfiles, setShowProfiles] = useState(true);

    // Search State
    const [options, setOptions] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Debounce search
    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            try {
                const url = searchTerm
                    ? `/teachers?search=${searchTerm}`
                    : `/teachers?status=active`; // Fetch all active if no search

                const response = await apiClient.get(url);
                // Filter out already added instructors
                const availableTeachers = response.data.data.filter((teacher: User) =>
                    !instructors.some(inst => inst.id === teacher.id)
                );
                setOptions(availableTeachers);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            fetchTeachers();
        }, searchTerm ? 500 : 0); // No debounce for initial open

        return () => clearTimeout(debounce);
    }, [searchTerm, instructors]);

    const handleAddInstructor = () => {
        if (selectedUser) {
            const newInstructor: Instructor = {
                id: selectedUser.id,
                name: `${selectedUser.first_name} ${selectedUser.last_name}`,
                email: selectedUser.email,
                avatar: selectedUser.avatar
            };
            setInstructors([...instructors, newInstructor]);
            setSelectedUser(null);
            setSearchTerm('');
            setOptions([]);
        }
    };

    const handleRemoveInstructor = (id: number) => {
        setInstructors(instructors.filter(inst => inst.id !== id));
    };

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Course Team Card */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3', boxShadow: 'none' }}>
                <Box sx={{ p: { xs: 3, md: 4 }, borderBottom: '1px solid #e7edf3' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3, mb: 4 }}>
                        <Box sx={{ maxWidth: '448px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Course Team</Typography>
                            <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>
                                Add or remove instructors for this specific course.
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2,
                            bgcolor: '#f6f7f8', borderRadius: '8px', border: '1px solid #e7edf3'
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0d141b', textTransform: 'uppercase' }}>Show Profiles</Typography>
                                <Typography sx={{ fontSize: '0.625rem', color: '#4c739a' }}>On course landing page</Typography>
                            </Box>
                            <Switch
                                checked={showProfiles}
                                onChange={(e) => setShowProfiles(e.target.checked)}
                                size="small"
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.palette.primary.main },
                                }}
                            />
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Add Instructor</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Autocomplete
                                fullWidth
                                openOnFocus
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
                                options={options}
                                loading={loading}
                                onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                                onChange={(_, newValue) => setSelectedUser(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search for an instructor by name or email..."
                                        size="medium"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: '#4c739a' }} />,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { bgcolor: 'rgba(246, 247, 248, 0.5)', borderRadius: '8px' }
                                        }}
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddInstructor}
                                disabled={!selectedUser}
                                sx={{
                                    px: 4,
                                    minWidth: 'fit-content',
                                    bgcolor: theme.palette.primary.main,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap',
                                    boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                }}
                            >
                                Add to Course
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 3, md: 4 }, spaceY: 4 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4c739a', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 3 }}>
                        Assigned Staff ({instructors.length})
                    </Typography>

                    <Grid container spacing={2}>
                        {instructors.map((instructor) => (
                            <Grid item xs={12} md={6} key={instructor.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        border: '1px solid #e7edf3',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        '&:hover': { border: `1px solid ${theme.palette.primary.main}4D`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            src={instructor.avatar}
                                            sx={{ width: 56, height: 56, border: '2px solid #e7edf3' }}
                                        />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0d141b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {instructor.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#4c739a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {instructor.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveInstructor(instructor.id)}
                                            sx={{ color: '#4c739a', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: '1.25rem' }} />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Paper>

        </Box>
    );
};

export default InstructorSection;
