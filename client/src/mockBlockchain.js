// Mock Blockchain Service - simulates smart contract behavior locally
// For MVP demo without MetaMask

const STORAGE_KEYS = {
    REQUESTS: 'ssdc_requests',
    USERS: 'ssdc_users',
    CURRENT_USER: 'ssdc_current_user'
};

// Generate mock numeric ID (fallback)
export const generateMockAddress = () => {
    const saved = localStorage.getItem('ssdc_users');
    if (saved) {
        const users = JSON.parse(saved);
        const ids = Object.keys(users).filter(id => /^\d+$/.test(id)).map(Number);
        if (ids.length > 0) return (Math.max(...ids) + 1).toString();
    }
    return "100001";
};

// Get all requests from storage
const getRequests = () => {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return data ? JSON.parse(data) : [];
};

// Save requests to storage
const saveRequests = (requests) => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
};

// Mock user management
export const mockLogin = (role, name) => {
    const existingUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (existingUser) {
        const user = JSON.parse(existingUser);
        // If name matches or is the same role (for orgs), stick with it
        if (user.role === role && (role === 'org' || user.name === name)) return user;
    }

    const displayName = name || (role === 'student' ? 'Demo Student' : 'Demo Organization');
    const user = {
        address: generateMockAddress(displayName),
        role: role, // 'student' or 'org'
        name: displayName
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
};

export const getCurrentUser = () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
};

export const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Mock smart contract functions
export const mockContract = {
    // Organization requests access from a student
    requestAccess: async (studentAddress, dataCid, fieldName, durationHours, note) => {
        const user = getCurrentUser();
        if (!user || user.role !== 'org') throw new Error('Only orgs can request');

        const requests = getRequests();
        const newRequest = {
            id: Date.now(),
            student: studentAddress,
            requester: user.address,
            requesterName: user.name,
            dataCid,
            fieldName,
            note: note || '',
            duration: durationHours * 3600,
            expiryTime: 0,
            isGranted: false,
            isRevoked: false,
            createdAt: new Date().toISOString()
        };

        requests.push(newRequest);
        saveRequests(requests);
        return newRequest;
    },

    // Student grants consent
    grantConsent: async (requestId) => {
        const user = getCurrentUser();
        if (!user || user.role !== 'student') throw new Error('Only students can grant');

        const requests = getRequests();
        const request = requests.find(r => r.id === requestId);

        if (!request) throw new Error('Request not found');
        if (request.student !== user.address) throw new Error('Not your request');

        request.isGranted = true;
        request.expiryTime = Date.now() + (request.duration * 1000);
        request.isRevoked = false;

        saveRequests(requests);
        return request;
    },

    // Student revokes consent
    revokeConsent: async (requestId) => {
        const user = getCurrentUser();
        if (!user || user.role !== 'student') throw new Error('Only students can revoke');

        const requests = getRequests();
        const request = requests.find(r => r.id === requestId);

        if (!request) throw new Error('Request not found');
        if (request.student !== user.address) throw new Error('Not your request');

        request.isRevoked = true;
        saveRequests(requests);
        return request;
    },

    // Check if access is valid
    isAccessValid: (requestId) => {
        const requests = getRequests();
        const request = requests.find(r => r.id === requestId);

        if (!request) return false;
        if (!request.isGranted) return false;
        if (request.isRevoked) return false;
        if (Date.now() > request.expiryTime) return false;

        return true;
    },

    // Get requests for a student
    getStudentRequests: (studentAddress) => {
        return getRequests().filter(r => r.student === studentAddress);
    },

    // Get requests sent by an org
    getOrgRequests: (orgAddress) => {
        return getRequests().filter(r => r.requester === orgAddress);
    },

    // Get all students (for org to select)
    getAllStudents: () => {
        // Return mock students for demo
        return [
            { address: '0xstudent1abc123def456', name: 'Alice Johnson' },
            { address: '0xstudent2xyz789ghi012', name: 'Bob Smith' },
            { address: '0xstudent3mno345pqr678', name: 'Carol Williams' }
        ];
    }
};

// Initialize with some demo data if empty
export const initDemoData = () => {
    // Clear old hex-address data if any exists to ensure fresh numeric start
    const requests = getRequests();
    if (requests.some(r => r.student && r.student.startsWith('0x'))) {
        localStorage.removeItem(STORAGE_KEYS.REQUESTS);
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        console.log('Cleared legacy hex-address data');
    }
};
