import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import '../css/Dashboard.css'
import accountImage from '../assets/account-image.jpg'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num)
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${Math.round(minutes)}m`
  return `${Math.round(hours)}h ${Math.round(minutes % 60)}m`
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('channels') // 'channels' or 'analytics'
  const [channels, setChannels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState([])
  const [removingChannels, setRemovingChannels] = useState([])
  const [newChannelId, setNewChannelId] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isConfirmClosing, setIsConfirmClosing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d') // '7d', '30d', '90d', '365d'
  const [selectedAnalyticsChannels, setSelectedAnalyticsChannels] = useState([]) // For analytics channel selection
  const [analyticsData, setAnalyticsData] = useState(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (activeTab === 'analytics' && selectedAnalyticsChannels.length > 0) {
      fetchAnalytics()
    }
  }, [activeTab, selectedAnalyticsChannels, selectedTimeframe])

  const fetchChannels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/settings/platforms')
      if (!response.ok) {
        throw new Error('Failed to fetch channels')
      }
      const data = await response.json()
      const youtubeData = data.find(p => p.platform === 'youtube')
      setChannels(youtubeData?.channels || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true)
      setAnalyticsError(null)
      
      const response = await fetch(
        `/api/settings/youtube/analytics?timeframe=${selectedTimeframe}&channelIds=${selectedAnalyticsChannels.join(',')}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      setAnalyticsError(err.message)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const handleConnectYouTube = async () => {
    try {
      const response = await fetch('/api/auth/youtube/connect')
      if (!response.ok) {
        throw new Error('Failed to initiate YouTube connection')
      }
      const data = await response.json()
      
      // Position the popup roughly center screen
      const width = 600
      const height = 600
      const left = (window.innerWidth - width) / 2
      const top = (window.innerHeight - height) / 2

      // Open the OAuth window
      const authWindow = window.open(
        data.authUrl,
        'YouTube Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Refresh YouTube data after successful connection
      const refreshYouTubeSection = async () => {
        try {
          // Add a small delay to let the server store any new channels
          await new Promise(resolve => setTimeout(resolve, 1000))
          await fetchChannels()
          setSuccessMessage('Channel connected successfully')
          setTimeout(() => setSuccessMessage(''), 5000)
        } catch (err) {
          setError('Failed to refresh YouTube channels')
          setTimeout(() => setError(null), 5000)
        }
      }

      // Handler for receiving messages from the popup
      const handleCallback = async (event) => {
        try {
          // Check for an object message
          if (typeof event.data === 'object') {
            if (event.data.type === 'youtube_success') {
              // Close the popup
              if (authWindow && !authWindow.closed) {
                authWindow.close()
              }
              // Refresh channels
              await refreshYouTubeSection()
              return
            }
          }

          // Check for a legacy "success" string
          if (event.data === 'success') {
            if (authWindow && !authWindow.closed) {
              authWindow.close()
            }
            await refreshYouTubeSection()
          } else if (event.data === 'error') {
            setError('Failed to connect YouTube account')
          }
        } catch (err) {
          setError('Failed to connect YouTube account')
        }
      }

      // Add message listener
      window.addEventListener('message', handleCallback)

      // Poll if the user closes the popup manually
      const checkInterval = setInterval(async () => {
        try {
          if (!authWindow || authWindow.closed) {
            clearInterval(checkInterval)
            await refreshYouTubeSection()
          }
        } catch (err) {
          clearInterval(checkInterval)
          await refreshYouTubeSection()
        }
      }, 500)

      // Cleanup removes the message listener if user leaves the page
      return () => {
        window.removeEventListener('message', handleCallback)
        clearInterval(checkInterval)
      }
    } catch (err) {
      setError('Failed to initiate YouTube connection')
    }
  }

  const handleDisconnectYouTube = async () => {
    try {
      const response = await fetch('/api/settings/platforms/youtube', {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to disconnect YouTube account')
      }
      await fetchChannels()
      setSuccessMessage('YouTube account disconnected successfully')
      setTimeout(() => setSuccessMessage(''), 5000)
      closeMainModal()
    } catch (err) {
      setError('Failed to disconnect YouTube account')
      setTimeout(() => setError(null), 5000)
    }
  }

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
      setIsOpen(true)
    }, 200)
  }

  const handleShowConfirmModal = () => {
    setIsOpen(false)
    setIsConfirmOpen(true)
  }

  const toggleChannelSelection = (channelId) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const removeSelectedChannels = async () => {
    setRemovingChannels(selectedChannels)
    
    try {
      // Delete each selected channel
      await Promise.all(selectedChannels.map(channelId => 
        fetch(`/api/settings/youtube/channels/${channelId}`, {
          method: 'DELETE'
        })
      ))
      
      // Refetch channels after deletion
      await fetchChannels()
      
      setSelectedChannels([])
      setRemovingChannels([])
      closeConfirmModal()
      closeMainModal()
    } catch (err) {
      setError('Failed to remove channels')
    }
  }

  const getChartData = (metric) => {
    if (!analyticsData) return null

    const data = analyticsData.aggregated[metric]
    const labels = Object.keys(data.timeline).sort()
    const values = labels.map(date => data.timeline[date])

    return {
      labels,
      datasets: [{
        label: metric === 'revenue' ? 'Revenue (USD)' : 
               metric === 'watchTime' ? 'Watch Time (hours)' : 
               metric === 'subscribers' ? 'Net Subscribers' : 
               'Views',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4
      }]
    }
  }

  const getChartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  })

  const renderChannelsTab = () => (
    <>
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
                src={channel.thumbnailUrl}
                alt={channel.title} 
                className="channel-avatar"
              />
              <div className="channel-info">
                <h2 className="channel-name">{channel.title}</h2>
                <span className="channel-handle">{channel.customUrl || channel.id}</span>
              </div>
            </div>
            
            <div className="channel-stats">
              <div className="stat-item">
                <span className="stat-value">{formatNumber(channel.statistics.subscriberCount)}</span>
                <span className="stat-label">Subscribers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(channel.statistics.videoCount)}</span>
                <span className="stat-label">Videos</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(channel.statistics.viewCount)}</span>
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
    </>
  )

  const renderAnalyticsTab = () => (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-controls">
          <div className="channel-selector">
            <label>Select Channels:</label>
            <div className="channel-selector-options">
              <label className="channel-selector-all">
                <input
                  type="checkbox"
                  checked={selectedAnalyticsChannels.length === channels.length}
                  onChange={(e) => {
                    setSelectedAnalyticsChannels(
                      e.target.checked ? channels.map(c => c.id) : []
                    )
                  }}
                />
                All Channels
              </label>
              {channels.map(channel => (
                <label key={channel.id} className="channel-selector-item">
                  <input
                    type="checkbox"
                    checked={selectedAnalyticsChannels.includes(channel.id)}
                    onChange={(e) => {
                      setSelectedAnalyticsChannels(prev => 
                        e.target.checked
                          ? [...prev, channel.id]
                          : prev.filter(id => id !== channel.id)
                      )
                    }}
                  />
                  {channel.title}
                </label>
              ))}
            </div>
          </div>
          <div className="timeframe-selector">
            <label>Timeframe:</label>
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last 365 days</option>
            </select>
          </div>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="loading">Loading analytics data...</div>
      ) : analyticsError ? (
        <div className="error">Error: {analyticsError}</div>
      ) : !selectedAnalyticsChannels.length ? (
        <div className="analytics-empty">
          <p>Select one or more channels to view analytics</p>
        </div>
      ) : analyticsData ? (
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Views</h3>
            <div className="analytics-chart">
              <Line data={getChartData('views')} options={getChartOptions('Views')} />
            </div>
            <div className="analytics-summary">
              <div className="summary-stat">
                <span className="summary-label">Total Views</span>
                <span className="summary-value">{formatNumber(analyticsData.aggregated.views.total)}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Average Daily</span>
                <span className="summary-value">
                  {formatNumber(Math.round(analyticsData.aggregated.views.total / Object.keys(analyticsData.aggregated.views.timeline).length))}
                </span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Subscribers</h3>
            <div className="analytics-chart">
              <Line data={getChartData('subscribers')} options={getChartOptions('Subscribers')} />
            </div>
            <div className="analytics-summary">
              <div className="summary-stat">
                <span className="summary-label">Total Gained</span>
                <span className="summary-value">{formatNumber(analyticsData.aggregated.subscribers.gained)}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Net Growth</span>
                <span className={`summary-value ${analyticsData.aggregated.subscribers.gained - analyticsData.aggregated.subscribers.lost > 0 ? 'positive' : 'negative'}`}>
                  {formatNumber(analyticsData.aggregated.subscribers.gained - analyticsData.aggregated.subscribers.lost)}
                </span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Watch Time</h3>
            <div className="analytics-chart">
              <Line data={getChartData('watchTime')} options={getChartOptions('Watch Time')} />
            </div>
            <div className="analytics-summary">
              <div className="summary-stat">
                <span className="summary-label">Total Hours</span>
                <span className="summary-value">{formatDuration(analyticsData.aggregated.watchTime.total)}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Average Daily</span>
                <span className="summary-value">
                  {formatDuration(analyticsData.aggregated.watchTime.total / Object.keys(analyticsData.aggregated.watchTime.timeline).length)}
                </span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Revenue</h3>
            <div className="analytics-chart">
              <Line data={getChartData('revenue')} options={getChartOptions('Revenue')} />
            </div>
            <div className="analytics-summary">
              <div className="summary-stat">
                <span className="summary-label">Total Revenue</span>
                <span className="summary-value">{formatCurrency(analyticsData.aggregated.revenue.total)}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Average Daily</span>
                <span className="summary-value">
                  {formatCurrency(analyticsData.aggregated.revenue.total / Object.keys(analyticsData.aggregated.revenue.timeline).length)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  const handleCreateAll = () => {
    // TODO: Implement create for all functionality
    console.log('Create for all clicked')
  }

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="loading">Loading channels...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <h1 className="sidebar-title">Channel Manager</h1>
        <div className="sidebar-nav">
          <div 
            className={`sidebar-nav-item ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            <span>Channels</span>
          </div>
          <div 
            className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span>Analytics</span>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="create-all-btn" onClick={handleCreateAll}>
            Create For All
          </button>
          <button className="edit-channels-btn" onClick={() => setIsOpen(true)}>
            Edit Channels
          </button>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'channels' ? (
          <div className="channels-container">
            <div className="channels-grid">
              {renderChannelsTab()}
            </div>
          </div>
        ) : (
          <div className="analytics-container">
            {renderAnalyticsTab()}
          </div>
        )}

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>

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
                {channels.length > 0 ? (
                  <>
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
                            src={channel.thumbnailUrl} 
                            alt={channel.title}
                            className="channel-list-avatar"/>
                          <div className="channel-list-info">
                            <div className="channel-list-name">{channel.title}</div>
                            <div className="channel-list-handle">@{channel.customUrl || channel.id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="modal-footer">
                      {selectedChannels.length > 0 ? (
                        <button 
                          onClick={handleShowConfirmModal}
                          className="modal-btn modal-btn-danger modal-btn-full">
                          Remove Selected Channels ({selectedChannels.length})
                        </button>
                      ) : (
                        <>
                          <button 
                            className="modal-btn modal-btn-secondary"
                            onClick={handleConnectYouTube}
                          >
                            Connect Another Account
                          </button>
                          <button 
                            className="modal-btn modal-btn-danger"
                            onClick={handleDisconnectYouTube}
                          >
                            Disconnect All
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="connection-status">
                    <p className="connection-description">
                      Connect your YouTube accounts to manage your channels and generate content.
                    </p>
                    <button 
                      className="connect-btn"
                      onClick={handleConnectYouTube}
                    >
                      Connect Account
                    </button>
                  </div>
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
                Delete Channels
              </Dialog.Title>
              <div className="modal-body">
                <p>
                  Are you sure you want to remove {selectedChannels.length} {selectedChannels.length === 1 ? 'channel' : 'channels'}?
                </p>
                <p>
                  This action cannot be undone and the channels will be permanently removed from your account.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  onClick={closeConfirmModal}
                  className="modal-btn modal-btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={removeSelectedChannels}
                  className="modal-btn modal-btn-danger"
                  style={{ background: '#dc2626', color: 'white', borderColor: '#dc2626' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default Dashboard 