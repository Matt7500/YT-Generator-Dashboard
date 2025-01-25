import { useState } from 'react'
import '../css/Home.css'

function Home() {
  const [channels, setChannels] = useState([
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
        id: 3,
        name: "Cooking Masters",
        handle: "@cookingmasters",
        avatar: "placeholder-avatar.jpg",
        subscribers: "750K",
        videos: 320,
        views: "4.8M"
      },
  ])

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
        </div>
    </div>
  )
}

export default Home 