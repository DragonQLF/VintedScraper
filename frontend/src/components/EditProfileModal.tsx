import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Define custom styles for react-select to support dark mode
const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: 'var(--color-gray-700)', // Use CSS variable for dark background
    borderColor: state.isFocused ? 'var(--color-primary-500)' : 'var(--color-gray-600)', // Use CSS variable for dark border
    color: 'var(--color-gray-100)', // Use CSS variable for dark text
    '&:hover': {
      borderColor: state.isFocused ? 'var(--color-primary-500)' : 'var(--color-gray-500)', // Dark hover border
    },
    boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary-500)' : provided.boxShadow, // Dark focus ring
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-100)', // Dark text color for selected value
  }),
  input: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-100)', // Dark text color for input
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-400)', // Dark text color for placeholder
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#ffffff', // White background for menu
    border: '1px solid var(--color-gray-200)', // Lighter border for menu
    zIndex: 9999, // Ensure menu is on top
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Optional: add a subtle shadow
    opacity: 1, // Ensure opacity is not causing transparency
  }),
  menuList: (provided: any) => ({
    ...provided,
    backgroundColor: '#ffffff', // Ensure menu list has white background
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : '#ffffff', // Light backgrounds for options
    color: '#1f2937', // Black text color for options
    '&:active': {
      backgroundColor: '#c7d2fe', // Slightly darker active background
    },
  }),
  // Add styles for the container to ensure a background is set
  container: (provided: any) => ({
    ...provided,
    // The overall container doesn't need a background, but the elements within do.
    // We will target control, valueContainer, and indicatorContainer instead.
  }),
  // Add styles for the value container
  valueContainer: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color-gray-700)', // Dark background for value container
    color: 'var(--color-gray-100)', // Ensure text color is dark mode friendly
  }),
  // Add styles for the indicator container (dropdown arrow, clear button)
  indicatorContainer: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-400)', // Dark color for indicators
    '&:hover': {
      color: 'var(--color-gray-100)', // Dark hover color for indicators
    },
  }),
  // Add styles for the indicators (like the dropdown arrow)
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color-gray-600)', // Dark color for the separator
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-400)', // Dark color for the dropdown arrow
    '&:hover': {
      color: 'var(--color-gray-100)', // Dark hover color
    },
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    color: 'var(--color-gray-400)', // Dark color for the clear button
    '&:hover': {
      color: 'var(--color-gray-100)', // Dark hover color
    },
  }),
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    name: string;
    keywords: string;
    category?: string;
    subcategory?: string;
    brandId?: number;
    brand?: {
      id: number;
      name: string;
    };
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
    autoActions?: {
      autoFavorite: boolean;
      autoOffer: boolean;
      autoOfferPrice?: number;
      autoBuy: boolean;
    } | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  } | null;
}

interface FormData {
  name: string;
  keywords: string;
  category?: string;
  subcategory?: string;
  brandId?: number;
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
  autoActions?: {
    autoFavorite: boolean;
    autoOffer: boolean;
    autoOfferPrice?: number;
    autoBuy: boolean;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface BrandOption {
  value: number;
  label: string;
}

export default function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const { data: brands } = useQuery<Brand[]>({ queryKey: ['brands'], queryFn: async () => (await api.get('/brands')).data });

  const createProfile = useMutation({
    mutationFn: (newProfile: FormData) => api.post('/profiles', newProfile),
    onSuccess: () => {
      toast.success('Profile created successfully!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to create profile: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateProfile = useMutation({
    mutationFn: (updatedProfile: FormData) => api.put(`/profiles/${profile!.id}`, updatedProfile),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    },
  });

  const [formData, setFormData] = useState<FormData>(() => ({
    name: profile?.name ?? '',
    keywords: profile?.keywords ?? '',
    category: profile?.category ?? '',
    subcategory: profile?.subcategory ?? '',
    brandId: profile?.brandId ?? undefined,
    size: profile?.size ?? '',
    minPrice: profile?.minPrice ?? undefined,
    maxPrice: profile?.maxPrice ?? undefined,
    condition: profile?.condition ?? '',
    color: profile?.color ?? '',
    material: profile?.material ?? '',
    pattern: profile?.pattern ?? '',
    shippingCountry: profile?.shippingCountry ?? '',
    catalogId: profile?.catalogId ?? '',
    catalog: profile?.catalog ?? '',
    gender: profile?.gender ?? '',
    status: profile?.status ?? 'active',
    clothingSize: profile?.clothingSize ?? '',
    shoeSize: profile?.shoeSize ?? '',
    shoeSizeSystem: profile?.shoeSizeSystem ?? 'eu',
    clothingType: profile?.clothingType ?? '',
    season: profile?.season ?? '',
    style: profile?.style ?? '',
    isActive: profile?.isActive ?? true,
    priority: profile?.priority ?? 'MEDIUM',
    autoActions: {
      autoFavorite: profile?.autoActions?.autoFavorite ?? false,
      autoOffer: profile?.autoActions?.autoOffer ?? false,
      autoBuy: profile?.autoActions?.autoBuy ?? false,
      autoOfferPrice: profile?.autoActions?.autoOfferPrice ?? undefined
    }
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (value || '')
    }));
  };

  const handleAutoActionChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      autoActions: {
        ...prev.autoActions,
        [name]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedData: FormData = {
      ...formData,
      minPrice: formData.minPrice === '' ? undefined : formData.minPrice,
      maxPrice: formData.maxPrice === '' ? undefined : formData.maxPrice,
      autoActions: {
        autoFavorite: !!formData.autoActions?.autoFavorite,
        autoOffer: !!formData.autoActions?.autoOffer,
        autoBuy: !!formData.autoActions?.autoBuy,
        autoOfferPrice: formData.autoActions?.autoOffer
          ? (formData.autoActions.autoOfferPrice === '' ? undefined : formData.autoActions.autoOfferPrice)
          : undefined,
      } as any,
      isActive: !!formData.isActive,
      priority: formData.priority || 'MEDIUM',
    };

    const isEditing = profile && profile.id;

    if (isEditing) {
      updateProfile.mutate(processedData);
    } else {
      createProfile.mutate(processedData);
    }
  };

  const brandOptions = brands?.map((brand: any) => ({
    value: brand.id,
    label: brand.name,
  })) || [];

  const selectedBrand = brandOptions.find(option => option.value === formData.brandId);

  const isEditing = profile && profile.id;

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
  ];
  const selectedStatus = statusOptions.find(option => option.value === formData.status);

  const conditionOptions = [
    { value: '', label: 'Select Condition' },
    { value: 'new_with_tags', label: 'New with tags' },
    { value: 'new_without_tags', label: 'New without tags' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'satisfactory', label: 'Satisfactory' },
  ];
  const selectedCondition = conditionOptions.find(option => option.value === formData.condition);

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];
  const selectedPriority = priorityOptions.find(option => option.value === formData.priority);

  const shippingCountryOptions = [
    { value: '', label: 'Select Country' },
    { value: 'pt', label: 'Portugal' },
  ];
  const selectedShippingCountry = shippingCountryOptions.find(option => option.value === formData.shippingCountry);

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unisex', label: 'Unisex' },
  ];
  const selectedGender = genderOptions.find(option => option.value === formData.gender);

  const shoeSizeSystemOptions = [
    { value: '', label: 'Select System' },
    { value: 'eu', label: 'EU' },
    { value: 'us', label: 'US' },
    { value: 'uk', label: 'UK' },
  ];
  const selectedShoeSizeSystem = shoeSizeSystemOptions.find(option => option.value === formData.shoeSizeSystem);


  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-gray-900 p-8 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700 relative">
                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                <Dialog.Title
                  as="h3"
                  className="text-3xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
                >
                  {isEditing ? 'Edit Search Profile' : 'Create New Search Profile'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Basic Details Section */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Basic Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                          value={formData.name}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        required
                      />
                      </div>
                      <div>
                        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</label>
                        <input
                          type="text"
                          id="keywords"
                          name="keywords"
                          value={formData.keywords}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., vintage t-shirt, Nike shoes"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                      <Select
                        id="priority"
                        name="priority"
                        options={priorityOptions}
                        value={selectedPriority}
                        onChange={(option) => setFormData(prev => ({ ...prev, priority: option?.value || 'MEDIUM' }))}
                        styles={customStyles}
                        classNamePrefix="react-select"
                        className="mt-1"
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Higher priority profiles will be processed first.</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Active Profile</label>
                    </div>
                  </div>

                  {/* Pricing & Sizing Section */}
                  <div className="space-y-6 pt-8">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Pricing & Sizing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Price</label>
                      <input
                        type="number"
                        id="minPrice"
                        name="minPrice"
                        value={formData.minPrice || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="0.01"
                      />
                    </div>
                    <div>
                        <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Price</label>
                      <input
                        type="number"
                        id="maxPrice"
                        name="maxPrice"
                        value={formData.maxPrice || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="0.01"
                      />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size (Clothing/General)</label>
                      <input
                        type="text"
                        id="size"
                        name="size"
                        value={formData.size || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., M, L, 42"
                        />
                      </div>
                      <div>
                        <label htmlFor="clothingSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clothing Size</label>
                        <input
                          type="text"
                          id="clothingSize"
                          name="clothingSize"
                          value={formData.clothingSize || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., M, EU 40"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="shoeSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shoe Size</label>
                        <input
                          type="text"
                          id="shoeSize"
                          name="shoeSize"
                          value={formData.shoeSize || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., 42, 10"
                        />
                      </div>
                      <div>
                        <label htmlFor="shoeSizeSystem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shoe Size System</label>
                        <Select
                          id="shoeSizeSystem"
                          name="shoeSizeSystem"
                          options={shoeSizeSystemOptions}
                          value={selectedShoeSizeSystem}
                          onChange={(option) => setFormData(prev => ({ ...prev, shoeSizeSystem: option?.value || 'eu' }))}
                          styles={customStyles}
                          classNamePrefix="react-select"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Filters Section */}
                  <div className="space-y-6 pt-8">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Additional Filters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition</label>
                        <Select
                          id="condition"
                          name="condition"
                          options={conditionOptions}
                          value={selectedCondition}
                          onChange={(option) => setFormData(prev => ({ ...prev, condition: option?.value || '' }))}
                          styles={customStyles}
                          classNamePrefix="react-select"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                        <Select
                        id="brandId"
                        name="brandId"
                          options={brandOptions}
                          value={selectedBrand}
                          onChange={(option) => setFormData(prev => ({ ...prev, brandId: option?.value || undefined }))}
                          isClearable
                          placeholder="Select Brand"
                          styles={customStyles}
                          classNamePrefix="react-select"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          value={formData.category || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory</label>
                        <input
                          type="text"
                          id="subcategory"
                          name="subcategory"
                          value={formData.subcategory || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                      <input
                        type="text"
                        id="color"
                        name="color"
                        value={formData.color || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                        <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                      <input
                        type="text"
                        id="material"
                        name="material"
                        value={formData.material || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pattern</label>
                      <input
                        type="text"
                        id="pattern"
                        name="pattern"
                        value={formData.pattern || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shipping Country</label>
                        <Select
                          id="shippingCountry"
                          name="shippingCountry"
                          options={shippingCountryOptions}
                          value={selectedShippingCountry}
                          onChange={(option) => setFormData(prev => ({ ...prev, shippingCountry: option?.value || '' }))}
                          styles={customStyles}
                          classNamePrefix="react-select"
                          className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="catalogId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catalog ID</label>
                      <input
                        type="text"
                        id="catalogId"
                        name="catalogId"
                        value={formData.catalogId || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                        <label htmlFor="catalog" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catalog Name</label>
                      <input
                        type="text"
                        id="catalog"
                        name="catalog"
                        value={formData.catalog || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                        <Select
                          id="gender"
                          name="gender"
                          options={genderOptions}
                          value={selectedGender}
                          onChange={(option) => setFormData(prev => ({ ...prev, gender: option?.value || '' }))}
                          styles={customStyles}
                          classNamePrefix="react-select"
                          className="mt-1"
                      />
                    </div>
                    <div>
                        <label htmlFor="clothingType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clothing Type</label>
                      <input
                        type="text"
                        id="clothingType"
                        name="clothingType"
                        value={formData.clothingType || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="season" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Season</label>
                      <input
                        type="text"
                        id="season"
                        name="season"
                        value={formData.season || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Style</label>
                      <input
                        type="text"
                        id="style"
                        name="style"
                        value={formData.style || ''}
                        onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auto Actions Section */}
                  <div className="space-y-6 pt-8">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Auto Actions</h4>
                    <div className="space-y-4">
                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="autoFavorite"
                            name="autoFavorite"
                            type="checkbox"
                            checked={formData.autoActions?.autoFavorite || false}
                            onChange={(e) => handleAutoActionChange('autoFavorite', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="autoFavorite" className="font-medium text-gray-900 dark:text-gray-100">Favorite Automatically</label>
                          <p id="autoFavorite-description" className="text-gray-500 dark:text-gray-400">Automatically favorite new matches found by this profile.</p>
                        </div>
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                              id="autoOffer"
                            name="autoOffer"
                              type="checkbox"
                            checked={formData.autoActions?.autoOffer || false}
                              onChange={(e) => handleAutoActionChange('autoOffer', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6 flex-grow">
                          <label htmlFor="autoOffer" className="font-medium text-gray-900 dark:text-gray-100">Make Automatic Offer</label>
                          <p id="autoOffer-description" className="text-gray-500 dark:text-gray-400">Automatically send an offer for new matches if the price is below the specified amount.</p>
                          {formData.autoActions?.autoOffer && (
                            <div className="mt-2">
                          <label htmlFor="autoOfferPrice" className="sr-only">Offer Price</label>
                              <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                            </div>
                            <input
                              type="number"
                              id="autoOfferPrice"
                              name="autoActions.autoOfferPrice"
                              value={formData.autoActions?.autoOfferPrice || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                autoActions: {
                                  ...prev.autoActions,
                                  autoOfferPrice: e.target.value ? Number(e.target.value) : undefined
                                }
                              }))}
                                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                              placeholder="0.00"
                              aria-describedby="price-currency"
                              step="0.01"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm" id="price-currency">EUR</span>
                            </div>
                          </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                              id="autoBuy"
                            name="autoBuy"
                              type="checkbox"
                            checked={formData.autoActions?.autoBuy || false}
                              onChange={(e) => handleAutoActionChange('autoBuy', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                            />
                          </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="autoBuy" className="font-medium text-gray-900 dark:text-gray-100">Attempt Automatic Buy</label>
                          <p id="autoBuy-description" className="text-gray-500 dark:text-gray-400">Automatically attempt to buy new matches found by this profile.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-10 flex justify-end gap-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      className="rounded-md bg-gray-50 dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                    >
                      {isEditing ? 'Save Changes' : 'Create Profile'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 