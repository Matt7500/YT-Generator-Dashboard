import { useState } from 'react'
import '../css/Home.css'

function Home() {
  const [showEditModal, setShowEditModal] = useState(false)

  // Reduced to 4 channels
  const channels = [
    {
      id: 1,
      name: "Tech Reviews",
      handle: "@techreviews",
      avatar: "placeholder-avatar.jpg",
      subscribers: "250K",
      videos: 420,
      views: "2.1M"
    },
    {
      id: 2,
      name: "Gaming Central",
      handle: "@gamingcentral",
      avatar: "placeholder-avatar.jpg",
      subscribers: "500K",
      videos: 890,
      views: "5.2M"
    },
    {
      id: 3,
      name: "Cooking Masters",
      handle: "@cookingmasters",
      avatar: "placeholder-avatar.jpg",
      subscribers: "750K",
      videos: 320,
      views: "4.8M"
    },
    {
      id: 4,
      name: "Fitness Journey",
      handle: "@fitnessjourney",
      avatar: "placeholder-avatar.jpg",
      subscribers: "180K",
      videos: 250,
      views: "1.5M"
    }
  ]

  return (
    <div className="home">
        <div className="home-content">
            <header className="dashboard-header">
                <h1>Channel Manager</h1>
                <div className="header-actions">
                    <button className="add-channel-btn">Add Channel</button>
                    <button className="edit-channels-btn">Edit Channels</button>
                </div>
            </header>
            
            <div className="channels-grid">
                {channels.map(channel => (
                    <div className="channel-card" key={channel.id}>
                        <div className="channel-header">
                            <img 
                                src={channel.avatar}
                                alt={channel.name} 
                                className="channel-avatar"
                            />
                            <div className="channel-info">
                                <h2 className="channel-name">{channel.name}</h2>
                                <span className="channel-handle">{channel.handle}</span>
                            </div>
                        </div>
                        
                        <div className="channel-stats">
                            <div className="stat-item">
                                <span className="stat-value">{channel.subscribers}</span>
                                <span className="stat-label">Subscribers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{channel.videos}</span>
                                <span className="stat-label">Videos</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{channel.views}</span>
                                <span className="stat-label">Views</span>
                            </div>
                        </div>

                        <div className="channel-actions">
                            <button className="settings-btn">Settings</button>
                            <button className="create-video-btn">Create Video</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bottom-actions">
                <button className="create-all-videos-btn">Create for All</button>
            </div>

            {/* Edit Channels Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h2>Manage Channels</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </header>
                        <div className="modal-body">
                            <button className="add-channel-btn">Add New Channel</button>
                            <div className="channels-list">
                                {channels.map(channel => (
                                    <div className="channel-list-item" key={channel.id}>
                                        <img src={channel.avatar} alt={channel.name} className="channel-list-avatar" />
                                        <span>{channel.name}</span>
                                        <button className="remove-channel-btn">Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

export default Home 