import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import EditProfileModal from '../components/EditProfileModal';

interface SearchProfile {
  id: string;
  name: string;
  searchType: 'SIMPLE' | 'ADVANCED';
  searchQuery?: string;
  keywords?: string;
  minPrice?: number;
  maxPrice?: number;
  brandId?: number;
  brand?: {
    id: number;
    name: string;
  } | null;
  size?: string;
  condition?: string;
  color?: string;
  status: 'ACTIVE' | 'PAUSED';
  lastRun?: string;
  nextRun?: string;
  style?: string;
  isActive: boolean;
  autoActions?: {
    autoFavorite: boolean;
    autoOffer: boolean;
    autoOfferPrice?: number;
    autoBuy: boolean;
  } | null;
}

interface SearchFormData {
  name: string;
  keywords: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  color?: string;
  material?: string;
  pattern?: string;
  shippingCountry?: string;
  catalogId?: string;
  catalog?: string;
  gender?: string;
  status?: string;
  clothingSize?: string;
  shoeSize?: string;
  shoeSizeSystem?: string;
  clothingType?: string;
  season?: string;
  style?: string;
}

interface Brand {
  id: number;
  name: string;
}

const CONDITIONS = [
  { value: 'new_without_tags', label: 'New without tags' },
  { value: 'new_with_tags', label: 'New with tags' },
  { value: 'very_good', label: 'Very good' },
  { value: 'good', label: 'Good' },
  { value: 'satisfactory', label: 'Satisfactory' }
];

const COLORS = [
  'Black', 'White', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange',
  'Brown', 'Beige', 'Navy', 'Burgundy', 'Gold', 'Silver', 'Multicolor'
];

const MATERIALS = [
  'Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim', 'Linen', 'Synthetic',
  'Cashmere', 'Velvet', 'Fur', 'Lace', 'Satin', 'Jersey', 'Fleece'
];

const PATTERNS = [
  'Solid', 'Striped', 'Floral', 'Plaid', 'Checkered', 'Polka dot', 'Animal print',
  'Geometric', 'Abstract', 'Tie-dye', 'Camouflage', 'Paisley'
];

const GENDERS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' }
];

const SHIPPING_COUNTRIES = [
  'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Luxembourg',
  'Austria', 'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovenia', 'Greece', 'Portugal', 'United Kingdom', 'Ireland'
];

const CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'books', label: 'Books & Comics' },
  { value: 'sports', label: 'Sports & Leisure' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'beauty', label: 'Beauty & Health' }
];

const CLOTHING_TYPES = [
  'T-shirts', 'Shirts', 'Sweaters', 'Hoodies', 'Jackets', 'Coats', 'Dresses',
  'Skirts', 'Pants', 'Jeans', 'Shorts', 'Swimwear', 'Underwear', 'Socks',
  'Activewear', 'Formal Wear', 'Suits', 'Blazers', 'Vests', 'Pajamas'
];

const CLOTHING_SIZES = {
  men: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  women: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  boys: ['3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y', '15-16Y'],
  girls: ['3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y', '15-16Y']
};

const SHOE_SIZES = {
  eu: Array.from({ length: 20 }, (_, i) => (i + 35).toString()),
  uk: Array.from({ length: 12 }, (_, i) => ((i + 1) * 0.5).toFixed(1)),
  us: Array.from({ length: 12 }, (_, i) => (i + 1).toString())
};

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons'];

const STYLES = [
  'Casual', 'Formal', 'Sporty', 'Vintage', 'Bohemian', 'Minimalist',
  'Streetwear', 'Classic', 'Trendy', 'Luxury', 'Athletic', 'Business',
  'Party', 'Beach', 'Outdoor', 'Urban', 'Preppy', 'Gothic', 'Hipster'
];

export default function SearchProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<SearchFormData>({
    name: '',
    keywords: '',
    category: '',
    subcategory: '',
    brand: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    color: '',
    material: '',
    pattern: '',
    shippingCountry: '',
    catalogId: '',
    catalog: '',
    gender: '',
    status: 'active',
    clothingSize: '',
    shoeSize: '',
    shoeSizeSystem: 'eu',
    clothingType: '',
    season: '',
    style: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<SearchProfile | null>(null);

  const { data: profiles = [] } = useQuery<SearchProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const response = await api.get<{ data: { profiles: SearchProfile[] } }>('/search-profiles');
      return response.data.data.profiles;
    },
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data;
    },
  });

  const createProfile = useMutation({
    mutationFn: (data: SearchFormData) => 
      api.post('/search-profiles', data),
    onSuccess: () => {
      toast.success('Search profile created successfully');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      toast.error('Failed to create search profile');
      console.error('Error creating search profile:', error);
    }
  });

  const toggleProfile = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) => {
      const response = await api.put(`/search-profiles/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile status updated');
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/search-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete search profile');
      console.error('Error deleting search profile:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a name for your search profile');
      return;
    }
    createProfile.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to get available sizes based on category and gender
  const getAvailableSizes = () => {
    if (formData.category === 'clothing') {
      return CLOTHING_SIZES[formData.gender as keyof typeof CLOTHING_SIZES] || [];
    }
    if (formData.category === 'shoes') {
      return SHOE_SIZES[formData.shoeSizeSystem as keyof typeof SHOE_SIZES] || [];
    }
    return [];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Search Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          {/* Profile Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Profile Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Give your search profile a name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Main search input */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Search Keywords
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="Enter keywords (e.g., 'nike air max', 'adidas hoodie')"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.category === 'clothing' && (
              <div>
                <label htmlFor="clothingType" className="block text-sm font-medium text-gray-700 mb-1">
                  Clothing Type
                </label>
                <select
                  id="clothingType"
                  name="clothingType"
                  value={formData.clothingType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select type</option>
                  {CLOTHING_TYPES.map(type => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Optional filters */}
          {showFilters && (
            <div className="space-y-6 p-6 border border-gray-200 rounded-md bg-gray-50">
              {/* Gender and Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any gender</option>
                    {GENDERS.map(gender => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic size selection based on category */}
                {(formData.category === 'clothing' || formData.category === 'shoes') && (
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    {formData.category === 'shoes' && (
                      <select
                        name="shoeSizeSystem"
                        value={formData.shoeSizeSystem}
                        onChange={handleInputChange}
                        className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="eu">EU</option>
                        <option value="uk">UK</option>
                        <option value="us">US</option>
                      </select>
                    )}
                    <select
                      id="size"
                      name={formData.category === 'shoes' ? 'shoeSize' : 'clothingSize'}
                      value={formData.category === 'shoes' ? formData.shoeSize : formData.clothingSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select size</option>
                      {getAvailableSizes().map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Style and Season */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <select
                    id="style"
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any style</option>
                    {STYLES.map(style => (
                      <option key={style} value={style.toLowerCase()}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
                    Season
                  </label>
                  <select
                    id="season"
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any season</option>
                    {SEASONS.map(season => (
                      <option key={season} value={season.toLowerCase()}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price (€)
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    name="minPrice"
                    value={formData.minPrice}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price (€)
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    name="maxPrice"
                    value={formData.maxPrice}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Condition and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any condition</option>
                    {CONDITIONS.map(condition => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any gender</option>
                    {GENDERS.map(gender => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color and Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any color</option>
                    {COLORS.map(color => (
                      <option key={color} value={color.toLowerCase()}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <select
                    id="material"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any material</option>
                    {MATERIALS.map(material => (
                      <option key={material} value={material.toLowerCase()}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pattern and Shipping Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">
                    Pattern
                  </label>
                  <select
                    id="pattern"
                    name="pattern"
                    value={formData.pattern}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any pattern</option>
                    {PATTERNS.map(pattern => (
                      <option key={pattern} value={pattern.toLowerCase()}>
                        {pattern}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Country
                  </label>
                  <select
                    id="shippingCountry"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any country</option>
                    {SHIPPING_COUNTRIES.map(country => (
                      <option key={country} value={country.toLowerCase()}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createProfile.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {createProfile.isPending ? 'Creating...' : 'Create Search Profile'}
            </button>
          </div>
        </form>

        <div>
          <h2 className="text-xl font-bold mb-4">Your Profiles</h2>
          {profiles.length === 0 ? (
            <p className="text-gray-500">You haven't created any search profiles yet.</p>
          ) : (
            <ul className="space-y-4">
              {profiles.map((profile) => (
                <li key={profile.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{profile.name}</h3>
                    {profile.keywords && (
                      <div className="text-sm text-gray-500">
                        Keywords: {profile.keywords}
                      </div>
                    )}
                    {profile.brand && (
                      <div className="text-sm text-gray-500">
                        Brand: {profile.brand.name}
                      </div>
                    )}
                    {profile.size && (
                      <div className="text-sm text-gray-500">
                        Size: {profile.size}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        console.log('Profile being set to edit:', profile);
                        setProfileToEdit(profile);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProfile.mutate(profile.id)}
                      className="px-3 py-1 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProfileToEdit(null);
        }}
        profile={profileToEdit}
      />
    </div>
  );
} 