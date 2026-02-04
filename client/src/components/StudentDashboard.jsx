import { useState, useEffect } from 'react';
import { api } from '../api';

const Icons = {
    User: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Upload: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    File: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Check: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    X: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Shield: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
                <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shield-grad)" />
        </svg>
    ),
    Lock: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Building: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="2" />
            <line x1="15" y1="22" x2="15" y2="2" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="4" y1="14" x2="20" y2="14" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    )
};

const StudentDashboard = ({ user, onBack, onNotify }) => {
    const [requests, setRequests] = useState([]);
    const [file, setFile] = useState(null);
    const [fieldCategory, setFieldCategory] = useState('Transcript');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [user]);

    const loadRequests = async () => {
        if (user) {
            try {
                const response = await api.getStudentRequests(user.address);
                setRequests(response.requests || []);
            } catch (err) {
                console.error("Failed to load requests:", err);
            }
        }
    };

    const handleUpload = async () => {
        if (file && user) {
            setIsUploading(true);
            try {
                await api.uploadFile(file, user.address, fieldCategory, user.name);
                onNotify(`"${file.name}" stored as ${fieldCategory}.`, 'success');
                setFile(null);
            } catch (err) {
                onNotify('Upload failed: ' + err.message, 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleApprove = async (requestId) => {
        try {
            await api.grantConsent(requestId);
            onNotify('Access granted.', 'success');
            loadRequests();
        } catch (err) {
            onNotify('Error: ' + err.message, 'error');
        }
    };

    const handleRevoke = async (requestId) => {
        try {
            await api.revokeConsent(requestId);
            onNotify('Access revoked.', 'success');
            loadRequests();
        } catch (err) {
            onNotify('Error: ' + err.message, 'error');
        }
    };

    const getStatus = (request) => {
        if (request.isRevoked) return { text: 'Revoked', color: 'var(--error)', bg: 'var(--error-bg)' };
        if (!request.isGranted) return { text: 'Awaiting Consent', color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)' };
        if (Date.now() > request.expiryTime) return { text: 'Expired', color: 'var(--text-muted)', bg: 'rgba(0, 0, 0, 0.05)' };
        return { text: 'Active Authorization', color: 'var(--success)', bg: 'var(--success-bg)' };
    };

    return (
        <div className="animate-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0 4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
                <div>
                    <span className="text-gradient" style={{ fontWeight: '800', fontSize: '0.8125rem', letterSpacing: '0.1em' }}>CONTROL PANEL</span>
                    <h1 style={{ margin: '0.5rem 0 0', fontSize: '2.5rem' }}>Student Dashboard</h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-dim)', fontSize: '1rem' }}>Manage your verified credentials and data access permissions.</p>
                </div>
                <button className="btn btn-secondary" onClick={onBack}>
                    Return Home
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '3.5rem', alignItems: 'start' }}>
                {/* Left Column: Identity & Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '2rem' }}>
                        <label style={{ marginBottom: '1.5rem', display: 'block' }}>Verified Identity</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-md)'
                            }}>
                                <Icons.User />
                            </div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-main)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                                    {user?.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '2rem' }}>
                        <label style={{ marginBottom: '1.5rem', display: 'block' }}>Secure Data Ingestion</label>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.6875rem', marginBottom: '0.5rem' }}>Document Categorization</label>
                                <select value={fieldCategory} onChange={(e) => setFieldCategory(e.target.value)}>
                                    <option>Transcript</option>
                                    <option>ID Proof</option>
                                    <option>Degree Certificate</option>
                                    <option>Medical Records</option>
                                    <option>Internship Letter</option>
                                </select>
                            </div>

                            <div style={{
                                border: '2px dashed var(--border)',
                                padding: '2.5rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                background: 'var(--surface-light)',
                                cursor: 'pointer',
                            }}
                                className="glass-hover"
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                                    <Icons.Upload />
                                </div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                                    {file ? file.name : 'Select document'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    AES-256 encryption applied on upload
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                disabled={!file || isUploading}
                            >
                                <Icons.Shield />
                                {isUploading ? 'Finalizing Encryption...' : 'Secure & Store'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Governance */}
                <div>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: 'var(--primary)' }}><Icons.Lock /></div>
                        Access Governance
                    </h3>

                    {(!requests || requests.length === 0) ? (
                        <div className="glass" style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--surface-light)' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.3 }}>
                                <Icons.Building />
                            </div>
                            <h4 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Inbox Secure</h4>
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>No pending or active access requests found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {requests.map(request => {
                                if (!request) return null;
                                const status = getStatus(request);
                                return (
                                    <div key={request.id} className="glass glass-hover" style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{
                                                    padding: '12px',
                                                    background: 'var(--surface-light)',
                                                    borderRadius: '10px',
                                                    color: 'var(--primary)',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <Icons.Building />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '1.125rem' }}>{request.fieldName}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                                        Requestor: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{request.requesterName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Permissions</div>
                                                    <div style={{
                                                        color: status.color,
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '4px 10px',
                                                        background: status.bg,
                                                        borderRadius: '6px',
                                                        display: 'inline-block'
                                                    }}>
                                                        {status.text}
                                                    </div>
                                                </div>

                                                <div style={{ minWidth: '140px' }}>
                                                    {!request.isGranted && !request.isRevoked && (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ height: '40px', width: '100%', fontSize: '0.8125rem' }}
                                                            onClick={() => handleApprove(request.id)}
                                                        >
                                                            <Icons.Check />
                                                            Authorize
                                                        </button>
                                                    )}
                                                    {request.isGranted && !request.isRevoked && Date.now() <= request.expiryTime && (
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ height: '40px', width: '100%', fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                                                            onClick={() => handleRevoke(request.id)}
                                                        >
                                                            <Icons.X />
                                                            Revoke Access
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {request.note && (
                                            <div style={{
                                                marginTop: '1.25rem',
                                                padding: '1rem 1.25rem',
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                borderRadius: '8px',
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-dim)',
                                                borderLeft: '3px solid var(--primary)',
                                                lineHeight: '1.6'
                                            }}>
                                                <span style={{ fontWeight: '800', color: 'var(--primary)', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.6875rem' }}>Purpose of Request:</span>
                                                "{request.note}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
