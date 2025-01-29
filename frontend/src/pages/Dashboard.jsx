import { useAuth } from '../contexts/AuthContext';
import '../css/Dashboard.css';

const Dashboard = () => {
    const { user, userProfile } = useAuth();

    // Add debug logging
    console.log('Dashboard render:', {
        user,
        userProfile,
        'user?.id': user?.id,
        'userProfile?.name': userProfile?.name,
        'userProfile?.role': userProfile?.role,
        'userProfile?.subscription_tier': userProfile?.subscription_tier
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="dashboard">
            <div className="sidebar-spacer"></div>
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <p className="subtitle">Manage your YouTube channels and content</p>
                </div>

                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <h2>Profile Information</h2>
                        <div className="stats-content">
                            <div className="stat-row">
                                <span className="stat-label">User ID:</span>
                                <span className="stat-value">{user?.id || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Email:</span>
                                <span className="stat-value">{user?.email || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Name:</span>
                                <span className="stat-value">{userProfile?.name || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Role:</span>
                                <span className="stat-value">{userProfile?.role || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Subscription Tier:</span>
                                <span className="stat-value">{userProfile?.subscription_tier || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Subscription Status:</span>
                                <span className="stat-value">{userProfile?.subscription_status || 'N/A'}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Subscription Start:</span>
                                <span className="stat-value">{formatDate(userProfile?.subscription_start)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Subscription End:</span>
                                <span className="stat-value">{formatDate(userProfile?.subscription_end)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Created At:</span>
                                <span className="stat-value">{formatDate(userProfile?.created_at)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Updated At:</span>
                                <span className="stat-value">{formatDate(userProfile?.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
