// API Service for communicating with backend
const API_BASE = 'http://127.0.0.1:3001/api';

export const api = {
    // Register user
    register: async (name, password, role) => {
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, role })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }
            return response.json();
        } catch (error) {
            console.error('API: Registration error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Connect error: Backend server is not reachable. Please ensure the server is running on port 3001.');
            }
            throw error;
        }
    },

    // Login user
    login: async (name, password, role) => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, role })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
            return response.json();
        } catch (error) {
            console.error('API: Login error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Connection error: Backend server is not reachable. Please ensure the server is running on port 3001.');
            }
            throw error;
        }
    },

    // Upload file
    uploadFile: async (file, userAddress, fieldName, userName) => {
        console.log('API: Uploading file...', { fileName: file.name, userAddress, fieldName, userName });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userAddress', userAddress);
        formData.append('fieldName', fieldName);
        formData.append('userName', userName);

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });

            console.log('API: Upload response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error('API: Upload failed error:', error);
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            console.log('API: Upload successful:', data);
            return data;
        } catch (error) {
            console.error('API: Fetch error during upload:', error);
            throw error;
        }
    },

    // Get user's files
    getFiles: async (userAddress) => {
        const response = await fetch(`${API_BASE}/files/${userAddress}`);
        return response.json();
    },

    // Create access request
    createRequest: async (studentAddress, requesterAddress, requesterName, fieldName, durationHours, note) => {
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentAddress,
                requesterAddress,
                requesterName,
                fieldName,
                durationHours,
                note
            })
        });
        return response.json();
    },

    // Get requests for student
    getStudentRequests: async (address) => {
        const response = await fetch(`${API_BASE}/requests/student/${address}`);
        return response.json();
    },

    // Get requests by organization
    getOrgRequests: async (address) => {
        const response = await fetch(`${API_BASE}/requests/org/${address}`);
        return response.json();
    },

    // Grant consent
    grantConsent: async (requestId) => {
        const response = await fetch(`${API_BASE}/requests/${requestId}/grant`, {
            method: 'POST'
        });
        return response.json();
    },

    // Revoke consent
    revokeConsent: async (requestId) => {
        const response = await fetch(`${API_BASE}/requests/${requestId}/revoke`, {
            method: 'POST'
        });
        return response.json();
    },

    // Get all students
    getStudents: async () => {
        const response = await fetch(`${API_BASE}/students`);
        return response.json();
    },

    // Check if access is valid for a request object
    isAccessValid: (request) => {
        if (!request) return false;
        if (!request.isGranted) return false;
        if (request.isRevoked) return false;
        if (request.expiryTime && Date.now() > request.expiryTime) return false;
        return true;
    },

    // Health check
    healthCheck: async () => {
        try {
            const response = await fetch(`${API_BASE}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
};
