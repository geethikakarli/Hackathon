import React from 'react';

const AccessCard = ({ request, onApprove, onRevoke, isStudent }) => {
    const { id, requester, fieldName, duration, expiryTime, isGranted, isRevoked } = request;

    const isExpired = isGranted && Date.now() / 1000 > expiryTime;
    const status = isRevoked ? 'Revoked' : isExpired ? 'Expired' : isGranted ? 'Active' : 'Pending';

    return (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>{fieldName}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
                    Requested by: {requester.slice(0, 6)}...{requester.slice(-4)}
                </p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Duration: {duration / 3600} hrs
                </p>
            </div>

            <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: status === 'Active' ? '#4ade80' : status === 'Pending' ? '#fbbf24' : '#f87171' }}>
                    {status}
                </div>

                {isStudent && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isGranted && !isRevoked && (
                            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => onApprove(id)}>
                                Approve
                            </button>
                        )}
                        {isGranted && !isRevoked && !isExpired && (
                            <button className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent' }} onClick={() => onRevoke(id)}>
                                Revoke
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccessCard;
