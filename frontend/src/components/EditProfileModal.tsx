import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';

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
    backgroundColor: '#1f2937', // Use a hardcoded dark background color for menu
    border: '1px solid var(--color-gray-700)', // Dark border for menu
    zIndex: 9999, // Ensure menu is on top
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Optional: add a subtle shadow
    opacity: 1, // Ensure opacity is not causing transparency
  }),
  menuList: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color-gray-800)', // Ensure menu list has dark background
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'var(--color-primary-700)' : state.isFocused ? 'var(--color-gray-700)' : 'var(--color-gray-800)', // Dark background for options
    color: state.isSelected ? 'var(--color-white)' : 'var(--color-gray-100)', // Dark text color for options
    '&:active': {
      backgroundColor: 'var(--color-primary-800)', // Dark active background
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
}

interface BrandOption {
  value: number;
  label: string;
}

export default function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const { data: brands } = useQuery<Brand[]>({ queryKey: ['brands'], queryFn: async () => (await api.get('/brands')).data });

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<FormData>({
    defaultValues: {
      name: profile?.name,
      keywords: profile?.keywords,
      category: profile?.category,
      subcategory: profile?.subcategory,
      brandId: profile?.brandId,
      size: profile?.size,
      minPrice: profile?.minPrice,
      maxPrice: profile?.maxPrice,
      condition: profile?.condition,
      color: profile?.color,
      material: profile?.material,
      pattern: profile?.pattern,
      shippingCountry: profile?.shippingCountry,
      catalogId: profile?.catalogId,
      catalog: profile?.catalog,
      gender: profile?.gender,
      status: profile?.status,
      clothingSize: profile?.clothingSize,
      shoeSize: profile?.shoeSize,
      shoeSizeSystem: profile?.shoeSizeSystem,
      clothingType: profile?.clothingType,
      season: profile?.season,
      style: profile?.style,
      isActive: profile?.isActive ?? true,
      autoActions: profile?.autoActions || {
        autoFavorite: false,
        autoOffer: false,
        autoBuy: false,
        autoOfferPrice: undefined,
      }
    }
  });

  React.useEffect(() => {
    // Check if profile and brands data are loaded and if profile has a brandId
    if (profile && profile.brandId !== null && profile.brandId !== undefined && brands) {
      const selectedBrand = brands.find(brand => brand.id === profile.brandId);
      if (selectedBrand) {
        // Set the form value to the found brand's ID
        setValue('brandId', selectedBrand.id);
      } else {
        // If brandId exists in profile but not found in brands list (e.g., data mismatch),
        // optionally reset the value or log a warning.
        // For now, we'll just ensure no value is set if the brand isn't found.
        setValue('brandId', undefined);
      }
    } else if (!profile || profile.brandId === null || profile.brandId === undefined) {
      // If creating a new profile or profile has no brandId, ensure the value is reset
      setValue('brandId', undefined);
    }
  }, [profile, setValue, brands]);

  const isEditing = !!profile;

  const createProfile = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/profiles', data);
      return response.data.data.profile;
    },
    onSuccess: () => {
      toast.success('Perfil criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
    onError: () => {
      toast.error('Falha ao criar perfil.');
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (data: FormData) => {
      if (!profile?.id) {
        throw new Error('Profile ID is missing for update.');
      }
      await api.put(`/profiles/${profile.id}`, data);
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
    onError: () => {
      toast.error('Falha ao atualizar perfil.');
    }
  });

  const onSubmit = (data: FormData) => {
    const processedData: FormData = {
      ...data,
      minPrice: data.minPrice === '' || data.minPrice === null ? undefined : data.minPrice,
      maxPrice: data.maxPrice === '' || data.maxPrice === null ? undefined : data.maxPrice,
      autoActions: {
        autoFavorite: !!data.autoActions?.autoFavorite,
        autoOffer: !!data.autoActions?.autoOffer,
        autoBuy: !!data.autoActions?.autoBuy,
        autoOfferPrice: data.autoActions?.autoOffer
                          ? (data.autoActions.autoOfferPrice === '' || data.autoActions.autoOfferPrice === null ? undefined : data.autoActions.autoOfferPrice)
                          : undefined,
      } as any,
      isActive: !!data.isActive,
    };

    if (processedData.autoActions) {
      processedData.autoActions.autoFavorite = !!processedData.autoActions.autoFavorite;
      processedData.autoActions.autoOffer = !!processedData.autoActions.autoOffer;
      processedData.autoActions.autoBuy = !!processedData.autoActions.autoBuy;
    }

    if (isEditing) {
      updateProfile.mutate(processedData);
    } else {
      createProfile.mutate(processedData);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
                >
                  {isEditing ? 'Editar Perfil de Pesquisa' : 'Criar Novo Perfil de Pesquisa'}
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: 'Nome é obrigatório' })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Palavras-chave
                      </label>
                      <input
                        type="text"
                        {...register('keywords')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                        placeholder="Inserir palavras-chave separadas por vírgulas"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoria
                      </label>
                      <select
                        {...register('category')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                      >
                        <option value="">Selecionar Categoria</option>
                        <option value="women">Mulher</option>
                        <option value="men">Homem</option>
                        <option value="kids">Criança</option>
                        <option value="home">Casa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Condição
                      </label>
                      <select
                        {...register('condition')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                      >
                        <option value="">Selecionar Condição</option>
                        <option value="new_with_tags">Novo com etiquetas</option>
                        <option value="new_without_tags">Novo sem etiquetas</option>
                        <option value="very_good">Muito bom estado</option>
                        <option value="good">Bom estado</option>
                        <option value="satisfactory">Satisfatório</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Género
                      </label>
                      <select
                        {...register('gender')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                      >
                        <option value="">Selecionar Género</option>
                        <option value="women">Mulher</option>
                        <option value="men">Homem</option>
                        <option value="kids">Criança</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        País de Envio
                      </label>
                      <select
                        {...register('shippingCountry')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                      >
                        <option value="">Selecionar País</option>
                        <option value="pt">Portugal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preço Mínimo
                      </label>
                      <input
                        type="number"
                        {...register('minPrice', { min: 0, valueAsNumber: true })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preço Máximo
                      </label>
                      <input
                        type="number"
                        {...register('maxPrice', { min: 0, valueAsNumber: true })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Marca
                      </label>
                      <Controller
                        name="brandId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={brands?.map(brand => ({ value: brand.id, label: brand.name })) || []}
                            isClearable
                            placeholder="Select a brand"
                            className="block w-full rounded-md shadow-sm sm:text-sm p-2"
                            styles={customStyles}
                            onChange={(option) => field.onChange(option ? option.value : null)}
                            value={brands?.map(brand => ({ value: brand.id, label: brand.name })).find(option => option.value === field.value) || null}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tamanho
                      </label>
                      <input
                        type="text"
                        {...register('size')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cor
                      </label>
                      <input
                        type="text"
                        {...register('color')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Material
                      </label>
                      <input
                        type="text"
                        {...register('material')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Padrão
                      </label>
                      <input
                        type="text"
                        {...register('pattern')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ID do Catálogo
                      </label>
                      <input
                        type="text"
                        {...register('catalogId')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome do Catálogo
                      </label>
                      <input
                        type="text"
                        {...register('catalog')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tamanho de Roupa
                      </label>
                      <input
                        type="text"
                        {...register('clothingSize')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tamanho de Calçado
                      </label>
                      <input
                        type="text"
                        {...register('shoeSize')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sistema de Tamanho de Calçado
                      </label>
                      <input
                        type="text"
                        {...register('shoeSizeSystem')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                        placeholder="e.g., EU, US, UK"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Roupa
                      </label>
                      <input
                        type="text"
                        {...register('clothingType')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estação
                      </label>
                      <input
                        type="text"
                        {...register('season')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estilo
                      </label>
                      <input
                        type="text"
                        {...register('style')}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                      />
                    </div>

                    <div className="flex items-center mt-6">
                      <div className="relative">
                        <input
                          id="isActive"
                          {...register('isActive')}
                          type="checkbox"
                          className="relative peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 checked:bg-indigo-600 checked:border-indigo-600 dark:checked:bg-indigo-500 dark:checked:border-indigo-500 transition-all duration-200"
                        />
                        <svg className="absolute top-0 left-0 h-4 w-4 text-white dark:text-gray-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                        Active Profile
                      </label>
                    </div>
                  </div>

                  {/* Auto Actions Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ações Automáticas</h4>
                    <div className="space-y-4">
                      <div className="relative flex items-start">
                        <div className="flex items-center">
                          <div className="relative">
                            <input
                              id="autoFavorite"
                              aria-describedby="autoFavorite-description"
                              {...register('autoActions.autoFavorite')}
                              type="checkbox"
                              className="relative peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 checked:bg-indigo-600 checked:border-indigo-600 dark:checked:bg-indigo-500 dark:checked:border-indigo-500 transition-all duration-200"
                            />
                            <svg className="absolute top-0 left-0 h-4 w-4 text-white dark:text-gray-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <label htmlFor="autoFavorite" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">Favoritar Automaticamente</label>
                        </div>
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex items-center">
                          <div className="relative">
                            <input
                              id="autoOffer"
                              aria-describedby="autoOffer-description"
                              {...register('autoActions.autoOffer')}
                              type="checkbox"
                              className="relative peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 checked:bg-indigo-600 checked:border-indigo-600 dark:checked:bg-indigo-500 dark:checked:border-indigo-500 transition-all duration-200"
                            />
                             <svg className="absolute top-0 left-0 h-4 w-4 text-white dark:text-gray-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <label htmlFor="autoOffer" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">Oferta Automática</label>
                        </div>
                        <div className="ml-auto flex items-center">
                          <label htmlFor="autoOfferPrice" className="sr-only">Offer Price</label>
                          <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                            </div>
                            <input
                              type="number"
                              {...register('autoActions.autoOfferPrice', { valueAsNumber: true })}
                              id="autoOfferPrice"
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-7 pr-12 focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                              placeholder="0.00"
                              aria-describedby="price-currency"
                              step="0.01"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm" id="price-currency">EUR</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <div className="relative">
                            <input
                              id="autoBuy"
                              aria-describedby="autoBuy-description"
                              {...register('autoActions.autoBuy')}
                              type="checkbox"
                              className="relative peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 checked:bg-indigo-600 checked:border-indigo-600 dark:checked:bg-indigo-500 dark:checked:border-indigo-500 transition-all duration-200"
                            />
                            <svg className="absolute top-0 left-0 h-4 w-4 text-white dark:text-gray-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <label htmlFor="autoBuy" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">Comprar Automaticamente</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createProfile.isPending || updateProfile.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isEditing ? (updateProfile.isPending ? 'Guardando...' : 'Guardar Alterações') : (createProfile.isPending ? 'Criando...' : 'Criar Perfil')}
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