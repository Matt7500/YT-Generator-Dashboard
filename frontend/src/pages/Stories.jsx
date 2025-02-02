import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaEdit, FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../css/Stories.css';
import NewStoryModal from '../components/NewStoryModal';
import { useLayout } from '../contexts/LayoutContext';

const DeleteModal = ({ isOpen, onClose, onConfirm, storyTitle }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200); // Match this with CSS animation duration
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
            <div className={`delete-modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}>
                    <FaTimes />
                </button>
                <div className="delete-modal-content">
                    <h2>Delete Story</h2>
                    <p>Are you sure you want to delete <strong>{storyTitle}</strong>?</p>
                    <p className="warning-text">
                        <FaExclamationTriangle />
                        This action cannot be undone.
                    </p>
                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={handleClose}>
                            Cancel
                        </button>
                        <button className="delete-confirm-btn" onClick={onConfirm}>
                            Delete Story
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Stories = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { PageWrapper } = useLayout();
    // State variables to manage stories, loading state, and any errors
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadedImages, setLoadedImages] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        genre: 'all'
    });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, storyId: null, storyTitle: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Function to fetch stories from Supabase
    const fetchStories = async () => {
        try {
            // Get the current user's session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No authenticated user');
            }

            // Fetch stories with their associated YouTube channel information
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    youtube_accounts!channel_id (
                        id,
                        channel_name,
                        thumbnail_url
                    )
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('Fetched stories with channels:', data);
            setStories(data || []);

            // Initialize image loading states
            const imageStates = {};
            data?.forEach(story => {
                if (story.youtube_accounts?.thumbnail_url) {
                    imageStates[story.youtube_accounts.id] = false;
                }
            });
            setLoadedImages(imageStates);
        } catch (err) {
            console.error('Error fetching stories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Preload images when stories are loaded
    useEffect(() => {
        stories.forEach(story => {
            if (story.youtube_accounts?.thumbnail_url) {
                const img = new Image();
                img.src = story.youtube_accounts.thumbnail_url;
                img.onload = () => {
                    setLoadedImages(prev => ({
                        ...prev,
                        [story.youtube_accounts.id]: true
                    }));
                };
                img.onerror = () => {
                    // Try different image sizes and formats on error
                    if (img.src.includes('=s240-c-k-c0x00ffffff-no-rj')) {
                        img.src = img.src.split('=')[0];
                    } else if (img.src.includes('yt3.ggpht.com') || img.src.includes('googleusercontent.com')) {
                        img.src = `${img.src.split('=')[0]}=s240-c-k-c0x00ffffff-no-rj`;
                    } else {
                        setLoadedImages(prev => ({
                            ...prev,
                            [story.youtube_accounts.id]: false
                        }));
                    }
                };
            }
        });
    }, [stories]);

    // Fetch stories when component mounts or location changes
    useEffect(() => {
        fetchStories();
    }, [location]);

    // Sorting function
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: 
                prevConfig.key === key && prevConfig.direction === 'asc' 
                    ? 'desc' 
                    : 'asc'
        }));
    };

    // Get unique genres and statuses for filters
    const genres = ['all', ...new Set(stories.map(story => story.genre))];
    const statuses = ['all', ...new Set(stories.map(story => story.status))];

    // Filter and sort stories
    const filteredAndSortedStories = stories
        .filter(story => {
            const matchesSearch = story.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                                story.youtube_accounts?.channel_name.toLowerCase().includes(filters.search.toLowerCase());
            const matchesStatus = filters.status === 'all' || story.status === filters.status;
            const matchesGenre = filters.genre === 'all' || story.genre === filters.genre;
            
            return matchesSearch && matchesStatus && matchesGenre;
        })
        .sort((a, b) => {
            if (sortConfig.key === 'created_at') {
                return sortConfig.direction === 'asc'
                    ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
                    : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
            }
            
            if (sortConfig.direction === 'asc') {
                return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
            }
            return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
        });

    const handleEditStory = (storyId) => {
        navigate(`/story-writer/${storyId}`);
    };

    const handleDeleteStory = async (storyId) => {
        try {
            const { error } = await supabase
                .from('stories')
                .delete()
                .eq('id', storyId);

            if (error) throw error;

            // Remove the story from the local state
            setStories(prevStories => prevStories.filter(story => story.id !== storyId));
            toast.success('Story deleted successfully');
            setDeleteModal({ isOpen: false, storyId: null, storyTitle: '' });
        } catch (err) {
            console.error('Error deleting story:', err);
            toast.error('Failed to delete story');
        }
    };

    const openDeleteModal = (story) => {
        setDeleteModal({
            isOpen: true,
            storyId: story.id,
            storyTitle: story.title
        });
    };

    // Show loading state
    if (loading) {
        return (
            <PageWrapper>
                <div className="stories-list-container">
                    <p>Loading stories...</p>
                </div>
            </PageWrapper>
        );
    }

    // Show error state
    if (error) {
        return (
            <PageWrapper>
                <div className="stories-list-container">
                    <p>Error: {error}</p>
                </div>
            </PageWrapper>
        );
    }

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    return (
        <PageWrapper>
            <div className="stories-list-container">
                <div className="filters-section">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search stories..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <div className="filter-selects">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="all">All Statuses</option>
                            {statuses.filter(status => status !== 'all').map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <select
                            value={filters.genre}
                            onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                        >
                            <option value="all">All Genres</option>
                            {genres.filter(genre => genre !== 'all').map(genre => (
                                <option key={genre} value={genre}>{genre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="list-categories">
                    <p className="sortable" onClick={() => handleSort('title')}>
                        Title {getSortIcon('title')}
                    </p>
                    <p>Channel</p>
                    <p className="sortable" onClick={() => handleSort('created_at')}>
                        Date {getSortIcon('created_at')}
                    </p>
                    <p className="sortable" onClick={() => handleSort('genre')}>
                        Genre {getSortIcon('genre')}
                    </p>
                    <p className="sortable" onClick={() => handleSort('status')}>
                        Status {getSortIcon('status')}
                    </p>
                    <p className="sortable" onClick={() => handleSort('word_count')}>
                        Word Count {getSortIcon('word_count')}
                    </p>
                    <p>Actions</p>
                </div>

                {filteredAndSortedStories.length === 0 ? (
                    <p style={{ padding: '20px' }}>No stories found. Create your first story!</p>
                ) : (
                    filteredAndSortedStories.map((story) => {
                        console.log('Story channel data:', story.youtube_accounts);
                        return (
                            <div key={story.id} className="stories-card">
                                <p>{story.title}</p>
                                <div className="channel-info">
                                    <div className="channel-thumbnail-wrapper-small">
                                        {story.youtube_accounts && loadedImages[story.youtube_accounts.id] === false && (
                                            <div className="thumbnail-placeholder-small pulse" />
                                        )}
                                        <img 
                                            src={story.youtube_accounts?.thumbnail_url || '/default-channel.png'} 
                                            alt={`${story.youtube_accounts?.channel_name || 'Default'} thumbnail`}
                                            className={`channel-thumbnail-small ${story.youtube_accounts && loadedImages[story.youtube_accounts.id] ? 'loaded' : ''}`}
                                            loading="lazy"
                                            onError={(e) => {
                                                const currentSrc = e.target.src;
                                                
                                                // Don't retry if we're already on the default image
                                                if (currentSrc === '/default-channel.png') {
                                                    if (story.youtube_accounts) {
                                                        setLoadedImages(prev => ({
                                                            ...prev,
                                                            [story.youtube_accounts.id]: false
                                                        }));
                                                    }
                                                    return;
                                                }

                                                // Try different image sizes and formats
                                                if (currentSrc.includes('=s240-c-k-c0x00ffffff-no-rj')) {
                                                    e.target.src = currentSrc.split('=')[0];
                                                } else if (currentSrc.includes('yt3.ggpht.com') || currentSrc.includes('googleusercontent.com')) {
                                                    e.target.src = `${currentSrc.split('=')[0]}=s240-c-k-c0x00ffffff-no-rj`;
                                                } else {
                                                    e.target.src = '/default-channel.png';
                                                    if (story.youtube_accounts) {
                                                        setLoadedImages(prev => ({
                                                            ...prev,
                                                            [story.youtube_accounts.id]: false
                                                        }));
                                                    }
                                                }
                                            }}
                                            onLoad={(e) => {
                                                if (e.target.src !== '/default-channel.png' && story.youtube_accounts) {
                                                    setLoadedImages(prev => ({
                                                        ...prev,
                                                        [story.youtube_accounts.id]: true
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                    <span>{story.youtube_accounts?.channel_name || 'No channel selected'}</span>
                                </div>
                                <p>{new Date(story.created_at).toLocaleDateString()}</p>
                                <p>{story.genre}</p>
                                <p className={`status-badge ${story.status === 'in_progress' ? 'draft' : story.status}`}>{
                                    story.status === 'in_progress' || story.status === 'draft' ? 'Draft' :
                                    story.status === 'completed' ? 'Completed' :
                                    story.status
                                }</p>
                                <p>{story.word_count}</p>
                                <div className="action-buttons">
                                    <button 
                                        className="action-btn edit-btn"
                                        onClick={() => handleEditStory(story.id)}
                                        title="Edit story"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        className="action-btn delete-btn"
                                        onClick={() => openDeleteModal(story)}
                                        title="Delete story"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <DeleteModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, storyId: null, storyTitle: '' })}
                onConfirm={() => handleDeleteStory(deleteModal.storyId)}
                storyTitle={deleteModal.storyTitle}
            />
            <NewStoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                navigate={navigate}
            />
        </PageWrapper>
    );
};

export default Stories;