import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import '../css/Home.css'
import accountImage from '../assets/account-image.jpg'

function Dashboard() {
  const [channels, setChannels] = useState([
    {
      id: 1,
      name: "Tech Reviews",
      handle: "@techreviews",
      avatar: accountImage,
      subscribers: "250K",
      videos: 420,
      views: "2.1M"
    },
    {
      id: 2,
      name: "Gaming Central",
      handle: "@gamingcentral",
      avatar: accountImage,
      subscribers: "500K",
      videos: 890,
      views: "5.2M"
    },
    {
      id: 3,
      name: "Cooking Masterss",
      handle: "@cookingmasterss",
      avatar: accountImage,
      subscribers: "751K",
      videos: 321,
      views: "4.6M"
    },
    {
      id: 4,
      name: "Cooking Masters",
      handle: "@cookingmasters",
      avatar: accountImage,
      subscribers: "750K",
      videos: 320,
      views: "4.8M"
    },
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState([])
  const [removingChannels, setRemovingChannels] = useState([])
  const [newChannelId, setNewChannelId] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isConfirmClosing, setIsConfirmClosing] = useState(false)

  const closeMainModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setIsOpen(false)
      setSelectedChannels([])
    }, 200)
  }

  const closeConfirmModal = () => {
    setIsConfirmClosing(true)
    setTimeout(() => {
      setIsConfirmClosing(false)
      setIsConfirmOpen(false)
    }, 200)
  }

  const toggleChannelSelection = (channelId) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const removeSelectedChannels = () => {
    setRemovingChannels(selectedChannels)
    
    setTimeout(() => {
      setChannels(prev => prev.filter(channel => !selectedChannels.includes(channel.id)))
      setSelectedChannels([])
      setRemovingChannels([])
      closeConfirmModal()
      closeMainModal()
    }, 300)
  }

  const addNewChannel = () => {
    const id = Date.now()
    const newChannel = {
      id,
      name: "New Channel",
      handle: "@newchannel",
      avatar: accountImage,
      subscribers: "0",
      videos: 0,
      views: "0"
    }
    setChannels(prev => [...prev, newChannel])
    setNewChannelId(id)
    setTimeout(() => setNewChannelId(null), 300)
    closeMainModal()
  }

  return (
    <div className="home">
      <div className="home-content">
        <header className="dashboard-header">
          <h1>Channel Manager</h1>
          <div className="header-actions">
            <button className="create-all-videos-btn">Create for All</button>
            <button 
              type="button"
              onClick={() => setIsOpen(true)} 
              className="edit-channels-btn">
              Edit Channels
            </button>
          </div>
        </header>

        {isOpen && (
          <Dialog 
            as="div" 
            open={isOpen} 
            onClose={closeMainModal}
            className={`dialog-overlay ${isClosing ? 'data-closing' : ''}`}
          >
            <div className="modal-backdrop" />
            <div className="modal-container">
              <div className="modal-content">
                <Dialog.Title className="modal-title">
                  Edit Channels
                  <button 
                    onClick={closeMainModal}
                    className="close-modal-btn"
                    aria-label="Close">
                    ×
                  </button>
                </Dialog.Title>
                <div className="modal-body">
                  <div className="channels-list">
                    {channels.map(channel => (
                      <div 
                        key={channel.id} 
                        className={`channel-list-item ${
                          selectedChannels.includes(channel.id) ? 'selected' : ''
                        }`}>
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes(channel.id)}
                          onChange={() => toggleChannelSelection(channel.id)}
                          className="channel-checkbox"/>
                        <img 
                          src={channel.avatar} 
                          alt={channel.name}
                          className="channel-list-avatar"/>
                        <div className="channel-list-info">
                          <div className="channel-list-name">{channel.name}</div>
                          <div className="channel-list-handle">{channel.handle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  {selectedChannels.length > 0 ? (
                    <button 
                      onClick={() => setIsConfirmOpen(true)}
                      className="remove-selected-btn">
                      Remove Selected ({selectedChannels.length})
                    </button>
                  ) : (
                    <button 
                      onClick={addNewChannel}
                      className="add-channel-btn">
                      Add New Channel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Dialog>
        )}

        {isConfirmOpen && (
          <Dialog 
            as="div" 
            open={isConfirmOpen} 
            onClose={closeConfirmModal}
            className={`dialog-overlay ${isConfirmClosing ? 'data-closing' : ''}`}
          >
            <div className="modal-backdrop" />
            <div className="modal-container">
              <div className="modal-content confirm-dialog">
                <Dialog.Title className="modal-title">
                  Confirm Deletion
                </Dialog.Title>
                <div className="modal-body">
                  <p>Remove {selectedChannels.length} selected channel{selectedChannels.length > 1 ? 's' : ''}?</p>
                  <p>This action cannot be undone. The channels will be permanently removed from your account.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    onClick={closeConfirmModal}
                    className="close-btn">
                    Cancel
                  </button>
                  <button 
                    onClick={removeSelectedChannels}
                    className="remove-selected-btn">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        )}

        <div className="channels-grid">
          {channels.map(channel => (
            <div 
              className={`channel-card ${
                removingChannels.includes(channel.id) ? 'removing' : ''
              } ${newChannelId === channel.id ? 'new' : ''}`}
              key={`channel-${channel.id}`}
            >
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
      </div>
    </div>
  )
}

export default Dashboard 