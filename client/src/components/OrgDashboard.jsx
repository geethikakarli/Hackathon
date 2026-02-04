import { useState, useEffect } from 'react';
import { api } from '../api';

const Icons = {
    Search: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Send: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    Eye: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Clock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    User: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    History: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <polyline points="3 3 3 8 8 8" />
            <line x1="12" y1="7" x2="12" y2="12" />
            <line x1="12" y1="12" x2="16" y2="14" />
        </svg>
    )
};

const OrgDashboard = ({ user, onBack, onNotify }) => {
    const [requests, setRequests] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [fieldName, setFieldName] = useState('Transcript');
    const [duration, setDuration] = useState(24);
    const [note, setNote] = useState('');

    useEffect(() => {
        loadRequests();
        loadStudents();
    }, [user]);

    const loadStudents = async () => {
        try {
            const response = await api.getStudents();
            setStudents(response.students || []);
        } catch (err) {
            console.error("Failed to load students:", err);
        }
    };

    const loadRequests = async () => {
        if (user) {
            try {
                const response = await api.getOrgRequests(user.address);
                setRequests(response.requests || []);
            } catch (err) {
                console.error("Failed to load requests:", err);
            }
        }
    };

    const handleRequest = async () => {
        if (!selectedStudent) {
            onNotify('Please select a subject identity.', 'error');
            return;
        }

        try {
            await api.createRequest(selectedStudent, user.address, user.name, fieldName, duration, note);
            onNotify('Verification request initiated successfully.', 'success');
            setSelectedStudent('');
            setNote('');
            loadRequests();
        } catch (err) {
            onNotify('Error: ' + err.message, 'error');
        }
    };

    const getStatus = (request) => {
        if (request.isRevoked) return { text: 'Revoked', color: 'var(--error)', bg: 'var(--error-bg)' };
        if (!request.isGranted) return { text: 'Awaiting subject consent', color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)' };
        if (Date.now() > request.expiryTime) return { text: 'Access Expired', color: 'var(--text-muted)', bg: 'rgba(0, 0, 0, 0.05)' };
        return { text: 'Data Access Active', color: 'var(--success)', bg: 'var(--success-bg)' };
    };

    return (
        <div className="animate-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0 4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
                <div>
                    <span className="text-gradient" style={{ fontWeight: '800', fontSize: '0.8125rem', letterSpacing: '0.1em' }}>ENTERPRISE PORTAL</span>
                    <h1 style={{ margin: '0.5rem 0 0', fontSize: '2.5rem' }}>Organization Dashboard</h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-dim)', fontSize: '1rem' }}>High-integrity verification tools and subject data management.</p>
                </div>
                <button className="btn btn-secondary" onClick={onBack}>
                    Return Home
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '3.5rem', alignItems: 'start' }}>
                {/* Left Column: New Request */}
                <div className="glass" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ color: 'var(--primary)' }}><Icons.Search /></div>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', letterSpacing: '0.05em' }}>INITIATE VERIFICATION</h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label>Subject Identity</label>
                            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                                <option value="">-- Search Identity Registry --</option>
                                {(students || []).map(s => (
                                    <option key={s.address} value={s.address}>{s.name} ({s?.address?.slice(0, 10)}...)</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Required Data Field</label>
                            <select value={fieldName} onChange={(e) => setFieldName(e.target.value)}>
                                <option>Transcript</option>
                                <option>ID Proof</option>
                                <option>Degree Certificate</option>
                                <option>Medical Records</option>
                                <option>Internship Letter</option>
                            </select>
                        </div>

                        <div>
                            <label>Purpose for Access</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="State the enterprise requirement for this data..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    resize: 'none',
                                    lineHeight: '1.5'
                                }}
                            />
                        </div>

                        <div>
                            <label>Authorization Duration (Hours)</label>
                            <div style={{ position: 'relative' }}>
                                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" />
                                <div style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    pointerEvents: 'none'
                                }}>
                                    <Icons.Clock />
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleRequest}>
                            <Icons.Send />
                            Request
                        </button>
                    </div>
                </div>

                {/* Right Column: Audit Log */}
                <div>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: 'var(--primary)' }}><Icons.History /></div>
                        Audit Log & Data Access
                    </h3>

                    {(!requests || requests.length === 0) ? (
                        <div className="glass" style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--surface-light)' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.3 }}>
                                <Icons.Send />
                            </div>
                            <h4 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Clear History</h4>
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>No outgoing verification requests in the current session.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {requests.map(request => {
                                if (!request) return null;
                                const status = getStatus(request);
                                const hasAccess = api.isAccessValid(request);

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
                                                    <Icons.User />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '1.125rem' }}>{request.fieldName}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                                        Subject: <span style={{ color: 'var(--text-main)', fontWeight: '600', fontFamily: 'monospace' }}>{request?.student?.slice(0, 16)}...</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Status</div>
                                                    <div style={{
                                                        color: status.color,
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '4px 10px',
                                                        background: status.bg,
                                                        borderRadius: '6px'
                                                    }}>
                                                        {status.text}
                                                    </div>
                                                </div>

                                                <div style={{ minWidth: '180px' }}>
                                                    {hasAccess ? (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ height: '40px', width: '100%', fontSize: '0.8125rem' }}
                                                            onClick={() => {
                                                                if (request.dataCid) {
                                                                    window.open(`http://127.0.0.1:3001/api/view/${request.id}`, '_blank');
                                                                } else {
                                                                    onNotify('Data metadata sync pending from subject.', 'error');
                                                                }
                                                            }}
                                                        >
                                                            <Icons.Eye />
                                                            View Documents
                                                        </button>
                                                    ) : (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', background: 'var(--surface-light)', padding: '8px 12px', borderRadius: '6px' }}>
                                                            {request.isRevoked ? 'Authorization Terminated' : 'Awaiting Consent'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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

export default OrgDashboard;
