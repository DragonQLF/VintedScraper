import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  HeartIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import EditProfileModal from '../components/EditProfileModal';
import ScraperStatus from '../components/ScraperStatus';
import { Dialog, Transition } from '@headlessui/react';

interface Match {
  id: string;
  title: string;
  price: number;
  imageUrls: string;
  productUrl: string;
  condition?: string;
  totalPrice?: number;
  likes: number;
  matchedAt: string;
  searchProfile: {
    id: string;
    name: string;
  };
  actions: {
    type: string;
    status: string;
    price?: number;
  }[];
  status?: string;
  size?: string;
}

interface SearchProfile {
  id: string;
  name: string;
  keywords: string;
  category?: string;
  subcategory?: string;
  brand?: { id: number; name: string };
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  color?: string;
  material?: string;
  pattern?: string;
  shippingCountry?: string;
  catalogId?: string;
  catalog?: string;
  gender?: string;
  status: string;
  clothingSize?: string;
  shoeSize?: string;
  shoeSizeSystem?: string;
  clothingType?: string;
  season?: string;
  style?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  autoActions?: {
    id: string;
    autoFavorite: boolean;
    autoOffer: boolean;
    autoOfferPrice?: number;
    autoBuy: boolean;
    searchProfileId: string;
  } | null;
  _count?: {
    matches: number;
  };
}

interface FilterState {
  minPrice: string;
  maxPrice: string;
  condition: string;
}

// Move formatPrice function outside of the component
const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null) return 'N/A';
  return `€${price.toFixed(2)}`;
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; count: number }) => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Delete Selected Items
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete {count} selected item{count !== 1 ? 's' : ''}? This action cannot be undone.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={onConfirm}
                  >
                    Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Add this type declaration at the top of the file
declare global {
  interface Window {
    electron: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    condition: '',
  });

  // Add state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SearchProfile | null>(null);

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['matches', selectedProfile, filters.condition],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProfile !== 'all') {
        params.append('profileId', selectedProfile);
      }
      if (filters.condition) {
        params.append('condition', filters.condition);
      }
      const response = await api.get(`/matches?${params.toString()}`);
      return response.data.data.matches.map((match: any) => ({
        ...match,
        imageUrls: JSON.parse(match.imageUrls)[0] || '',
      }));
    }
  });

  const { data: profiles = [] } = useQuery<SearchProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const response = await api.get('/profiles');
      return response.data.data.profiles;
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data.notifications;
    },
    refetchInterval: 30000,
  });

  const triggerScraper = useMutation({
    mutationFn: async () => {
      await api.post('/scraper/trigger');
    },
    onSuccess: () => {
      toast.success('Scraper triggered successfully');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }, 5000);
    },
    onError: () => {
      toast.error('Failed to trigger scraper');
    }
  });

  const deleteMatch = useMutation({
    mutationFn: async (matchId: string) => {
      await api.delete(`/matches/${matchId}`);
    },
    onSuccess: () => {
      toast.success('Match deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setSelectedMatchIds(prev => prev.filter(id => id !== deleteMatch.variables));
    },
    onError: () => {
      toast.error('Failed to delete match');
    }
  });

  const bulkDeleteMatches = useMutation({
    mutationFn: async (matchIds: string[]) => {
      await api.post('/matches/bulk-delete', { ids: matchIds });
    },
    onSuccess: () => {
      toast.success(`${selectedMatchIds.length} matches deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setSelectedMatchIds([]);
    },
    onError: () => {
      toast.error('Failed to delete selected matches');
    }
  });

  // Profile delete mutation
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      await api.delete(`/profiles/${profileId}`);
    },
    onSuccess: () => {
      toast.success('Search profile deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      if (selectedProfile !== 'all') {
        setSelectedProfile('all');
      }
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: () => {
      toast.error('Failed to delete search profile');
    }
  });

  const handleAction = async (matchId: string, actionType: string) => {
    try {
      await api.post('/actions', { matchId, type: actionType });
      toast.success('Action created successfully');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (error) {
      toast.error('Failed to create action');
    }
  };

  const groupedAndFilteredMatches = useMemo(() => {
    const filtered = matches.filter((match) => {
      if (searchTerm && !match.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (selectedProfile !== 'all' && match.searchProfile.id !== selectedProfile) {
        return false;
      }

      if (filters.minPrice && match.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && match.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime();
      } else if (sortBy === 'price-asc') {
        return a.price - b.price;
      } else if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });

    return sorted.reduce((acc, match) => {
      const profileId = match.searchProfile.id;
      if (!acc[profileId]) {
        acc[profileId] = { profile: match.searchProfile, matches: [] };
      }
      acc[profileId].matches.push(match);
      return acc;
    }, {} as Record<string, { profile: Match['searchProfile']; matches: Match[] }>);
  }, [matches, selectedProfile, filters.minPrice, filters.maxPrice, searchTerm, sortBy]);

  const getMatchNotifications = (matchId: string) => {
    return notifications.filter(notif => notif.matchId === matchId);
  };

  const getMatchStatus = (matchId: string): 'new' | 'price_drop' | 'other' | undefined => {
    const matchNotifications = getMatchNotifications(matchId);
    const unreadNotifications = matchNotifications.filter(notif => !notif.isRead);
    
    if (unreadNotifications.some(notif => notif.type === 'NEW_MATCH')) {
      return 'new';
    }
    if (unreadNotifications.some(notif => notif.type === 'PRICE_DROP')) {
      return 'price_drop';
    }
    return undefined;
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const handleSelectAllMatches = () => {
    const allVisibleMatchIds = Object.values(groupedAndFilteredMatches).flatMap(group => group.matches.map(match => match.id));
    if (selectedMatchIds.length === allVisibleMatchIds.length) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(allVisibleMatchIds);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMatchIds.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    bulkDeleteMatches.mutate(selectedMatchIds);
    setShowDeleteConfirm(false);
  };

  function getLatestPriceChange(matchId: string) {
    const priceNotifications = getMatchNotifications(matchId).filter(notif => notif.type === 'PRICE_DROP');
    const latestNotification = priceNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return latestNotification ? latestNotification.message : null;
  }

  function getLatestStatusNotif(matchId: string) {
    const statusNotifications = getMatchNotifications(matchId).filter(notif => notif.type === 'NEW_MATCH');
    const latestNotification = statusNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return latestNotification ? latestNotification.message : null;
  }

  function StatusBadge({ status }: { status: string }) {
    const color = status === 'New Match' ? 'success' : status === 'Price Drop' ? 'primary' : 'default';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color === 'success' ? 'bg-green-100 text-green-800' : color === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  }

  function PriceDisplay({ match }: { match: Match }) {
    const hasProtection = match.totalPrice !== undefined && match.totalPrice !== null && match.totalPrice !== match.price;
    const protectionFee = hasProtection ? match.totalPrice! - match.price : 0;

    return (
      <div className="flex flex-col items-start gap-1 mt-1 mb-2">
        <span className="text-sm text-gray-700">
          Preço: <span className="font-medium">{formatPrice(match.price)}</span>
        </span>
        {hasProtection && (
          <span className="text-xs text-gray-500">
            Proteção do Comprador: +{formatPrice(protectionFee)}
          </span>
        )}
        {hasProtection && (
          <span className="text-base font-bold text-green-700 mt-1">
            Total: {formatPrice(match.totalPrice)}
            <span className="block text-xs text-gray-400 font-normal">
              (inclui Proteção do Comprador)
            </span>
          </span>
        )}
      </div>
    );
  }

  const handleEditProfile = (profile: SearchProfile | null) => {
    setEditingProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProfile(null);
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
  };

  // Calculate summary stats
  const totalMatches = matches.length;
  const newMatchesCount = matches.filter(m => getMatchStatus(m.id) === 'new').length;
  const priceDropsCount = matches.filter(m => getMatchStatus(m.id) === 'price_drop').length;

  // Add dark mode state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Update the handleExternalLink function
  const handleExternalLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    if (window.electron?.openExternal) {
      window.electron.openExternal(url);
    } else {
      // Fallback for when electron API is not available (e.g., in browser)
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
            Welcome back! Here's a summary of your Vinted matches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Matches Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200">
              <p className="text-5xl font-bold text-primary-600 dark:text-primary-400">{totalMatches}</p>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-300 mt-2">Total Matches</p>
            </div>

            {/* New Matches Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200">
              <p className="text-5xl font-bold text-green-500 dark:text-green-400">{newMatchesCount}</p>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-300 mt-2">New Matches</p>
            </div>

            {/* Price Drops Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200">
              <p className="text-5xl font-bold text-red-500 dark:text-red-400">{priceDropsCount}</p>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-300 mt-2">Price Drops</p>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Scraper:</span>
              <ScraperStatus />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => triggerScraper.mutate()}
                disabled={triggerScraper.isPending}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {triggerScraper.isPending ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin mr-3" aria-hidden="true" />
                ) : (
                  <MagnifyingGlassIcon className="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                )}
                Trigger Scraper
              </button>
              <button
                type="button"
                onClick={() => handleEditProfile(null)}
                className="inline-flex items-center rounded-md border border-primary-600 dark:border-primary-400 bg-white dark:bg-gray-800 px-6 py-3 text-base font-medium text-primary-600 dark:text-primary-400 shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <PlusIcon className="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                New Profile
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
          Search Profiles
        </h2>

        {/* Search Profiles Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((profile) => (
              <div
                key={profile.id}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {profile._count?.matches || 0} matches
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Keywords: {profile.keywords}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProfile(profile)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
                        title="Edit Profile"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this profile?')) {
                            deleteProfile.mutate(profile.id);
                          }
                        }}
                        disabled={deleteProfile.isPending && deleteProfile.variables === profile.id}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
                        title="Delete Profile"
                      >
                        {deleteProfile.isPending && deleteProfile.variables === profile.id ? (
                          <ArrowPathIcon className="animate-spin h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                        ) : (
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        profile.isActive
                          ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      } transition-colors duration-200`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {profile.priority && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          profile.priority === 'LOW' ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                          profile.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                          'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                        } transition-colors duration-200`}>
                          Priority: {profile.priority}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedProfile(profile.id)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 font-medium transition-colors duration-200"
                    >
                      View Matches
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Management Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <label htmlFor="profile-select" className="sr-only">Select Profile</label>
              <select
                id="profile-select"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="block w-full md:w-auto rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-base text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors shadow-sm"
              >
                <option value="all">All Profiles</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>

              <label htmlFor="sort-select" className="sr-only">Sort By</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')}
                className="block w-full md:w-auto rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-base text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              {selectedMatchIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Delete Selected ({selectedMatchIds.length})
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Term</label>
                  <input
                    type="text"
                    name="searchTerm"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex space-x-4">
                  <div>
                    <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Price</label>
                    <input
                      type="number"
                      name="minPrice"
                      id="minPrice"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Price</label>
                    <input
                      type="number"
                      name="maxPrice"
                      id="maxPrice"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition</label>
                  <select
                    id="condition"
                    name="condition"
                    value={filters.condition}
                    onChange={(e) => setFilters({...filters, condition: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Conditions</option>
                    <option value="6">Novo com etiquetas</option>
                    <option value="1">Novo sem etiquetas</option>
                    <option value="2">Muito bom</option>
                    <option value="3">Bom</option>
                    <option value="4">Satisfatório</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="relative flex items-center justify-center">
                <input
                  id="selectAllMatches"
                  name="selectAllMatches"
                  type="checkbox"
                  className="absolute h-4 w-4 cursor-pointer opacity-0"
                  checked={selectedMatchIds.length === Object.values(groupedAndFilteredMatches).flatMap(group => group.matches).length && Object.values(groupedAndFilteredMatches).flatMap(group => group.matches).length > 0}
                  onChange={handleSelectAllMatches}
                />
                <div className={`h-4 w-4 rounded ${selectedMatchIds.length > 0 ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'} transition-all duration-200 flex items-center justify-center border`}>
                  {selectedMatchIds.length > 0 && (
                    <svg className="h-3 w-3 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="selectAllMatches" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Select All Visible ({selectedMatchIds.length})
              </label>
            </div>
            {selectedMatchIds.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedMatchIds.length} item{selectedMatchIds.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {selectedMatchIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMatchIds([])}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Selection
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={bulkDeleteMatches.isPending}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
              >
                {bulkDeleteMatches.isPending ? (
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                ) : (
                  <XMarkIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {Object.entries(groupedAndFilteredMatches).length > 0 ? (
          Object.entries(groupedAndFilteredMatches).map(([profileId, data]) => {
            const profileMatchIds = data.matches.map(match => match.id);
            const selectedProfileMatchIds = selectedMatchIds.filter(id => profileMatchIds.includes(id));
            const isAllSelected = profileMatchIds.length > 0 && selectedProfileMatchIds.length === profileMatchIds.length;

            return (
              <div key={profileId} className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() => {
                              if (isAllSelected) {
                                setSelectedMatchIds(prev => prev.filter(id => !profileMatchIds.includes(id)));
                              } else {
                                setSelectedMatchIds(prev => [...new Set([...prev, ...profileMatchIds])]);
                              }
                            }}
                            className="absolute h-5 w-5 cursor-pointer opacity-0"
                          />
                          <div className={`h-5 w-5 rounded-md border-2 ${isAllSelected ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'} transition-all duration-200 flex items-center justify-center shadow`}>
                            {isAllSelected && (
                              <svg className="h-3.5 w-3.5 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-100">
                          Select All ({profileMatchIds.length})
                        </label>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{data.profile.name} ({data.matches.length} items)</h2>
                    </div>
                    {selectedProfileMatchIds.length > 0 && (
                      <button
                        onClick={() => bulkDeleteMatches.mutate(selectedProfileMatchIds)}
                        disabled={bulkDeleteMatches.isPending}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {bulkDeleteMatches.isPending ? (
                          <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        ) : (
                          <XMarkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        )}
                        Delete Selected ({selectedProfileMatchIds.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {data.matches.map(match => {
                      const matchStatus = getMatchStatus(match.id);
                      const isSelected = selectedMatchIds.includes(match.id);

                      return (
                        <div
                          key={match.id}
                          className={`relative bg-gray-100 dark:bg-gray-950 rounded-2xl border ${
                            isSelected 
                              ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500 dark:ring-indigo-400' 
                              : 'border-gray-200 dark:border-gray-700'
                          } shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden flex flex-col`}
                          style={{ minHeight: 420 }}
                        >
                          <div className="absolute top-3 left-3 z-10">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectMatch(match.id)}
                                className="absolute h-6 w-6 cursor-pointer opacity-0"
                              />
                              <div className={`h-6 w-6 rounded-md border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'} transition-all duration-200 flex items-center justify-center shadow`}>
                                {isSelected && (
                                  <svg className="h-4 w-4 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-3 right-3 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteMatch.mutate(match.id);
                              }}
                              disabled={deleteMatch.isPending}
                              className="p-1.5 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 dark:hover:text-white transition-colors flex items-center justify-center shadow-md"
                            >
                              {deleteMatch.isPending ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>

                          <div className="relative group">
                            <div className="absolute top-3 right-3 z-10">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteMatch.mutate(match.id);
                                }}
                                disabled={deleteMatch.isPending}
                                className="p-1.5 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 dark:hover:text-white transition-colors flex items-center justify-center shadow-md"
                              >
                                {deleteMatch.isPending ? (
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>
                            </div>

                            <a 
                              href={match.productUrl} 
                              onClick={(e) => handleExternalLink(e, match.productUrl)}
                              className="block"
                            >
                              <img
                                src={match.imageUrls}
                                alt={match.title}
                                className="w-full h-48 object-cover rounded-t-2xl transition-all duration-200 hover:brightness-95"
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                              />
                            </a>
                          </div>

                          <div className="p-4 flex-grow flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">
                              {match.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {/* Condition Badge */}
                              {match.condition && (
                                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10">
                                  {match.condition === 'new_with_tags' && 'Novo com etiquetas'}
                                  {match.condition === 'new_without_tags' && 'Novo sem etiquetas'}
                                  {match.condition === 'very_good' && 'Muito bom'}
                                  {match.condition === 'good' && 'Bom'}
                                  {match.condition === 'satisfactory' && 'Satisfatório'}
                                  {/* Fallback for unexpected condition values */}
                                  {match.condition !== 'new_with_tags' && match.condition !== 'new_without_tags' && match.condition !== 'very_good' && match.condition !== 'good' && match.condition !== 'satisfactory' && match.condition}
                                </span>
                              )}
                              {/* Size Badge */}
                              {match.size && (
                                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10">
                                  Size: {match.size}
                                </span>
                              )}
                            </div>

                            {/* Price Display */}
                            <div className="flex flex-col items-start gap-0 mt-auto">
                              {getMatchStatus(match.id) === 'price_drop' ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Preço: <span className="font-medium text-gray-900 dark:text-gray-100">
                                      <span className="line-through text-gray-500 dark:text-gray-400">
                                        {formatPrice(parseFloat(getLatestPriceChange(match.id)?.split('From €')[1]?.split(' to')[0] || '0'))}
                                      </span>
                                      {' → '}
                                      {formatPrice(match.price)}
                                    </span>
                                  </span>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                    <ArrowTrendingDownIcon className="h-4 w-4" />
                                    Price Drop Detected!
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Preço: <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(match.price)}</span>
                                </span>
                              )}
                              {match.totalPrice !== undefined && match.totalPrice !== null && match.totalPrice !== match.price && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Proteção do Comprador: <span className="font-medium">+{formatPrice(match.totalPrice - match.price)}</span>
                                </span>
                              )}
                              {match.totalPrice !== undefined && match.totalPrice !== null && match.totalPrice !== match.price && (
                                <span className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                  Total: {formatPrice(match.totalPrice)}
                                </span>
                              )}
                              {match.totalPrice !== undefined && match.totalPrice !== null && match.totalPrice !== match.price && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  (inclui Proteção do Comprador)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center">
                              <HeartIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{match.likes}</span>
                            </div>
                            {matchStatus === 'new' && (
                              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-700 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                                NEW MATCH
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-300">
            No matches found for the selected criteria.
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={editingProfile}
          />
        )}

        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          count={selectedMatchIds.length}
        />
      </div>
    </div>
  );
}