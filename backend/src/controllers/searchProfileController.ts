import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      searchType = 'ADVANCED',
      keywords,
      tags,
      minPrice,
      maxPrice,
      size,
      brandId,
      condition,
      minRating,
      autoActions,
      category,
      subcategory,
      color,
      material,
      pattern,
      shippingCountry,
      catalogId,
      catalog,
      gender,
      status = 'active',
      clothingSize,
      shoeSize,
      shoeSizeSystem,
      clothingType,
      season,
      style,
      isActive = true,
    } = req.body;

    // Validate search type
    if (searchType !== 'SIMPLE' && searchType !== 'ADVANCED') {
      throw new AppError(400, 'Invalid search type. Must be either SIMPLE or ADVANCED');
    }

    // For simple search, only keywords are required
    if (searchType === 'SIMPLE' && !keywords) {
      throw new AppError(400, 'Keywords are required for simple search');
    }

    // If brandId is provided, validate that it exists
    if (brandId) {
      const brandExists = await prisma.brand.findUnique({
        where: { id: brandId }
      });
      if (!brandExists) {
        throw new AppError(400, 'Invalid brand ID');
      }
    }

    const profile = await prisma.searchProfile.create({
      data: {
        name,
        keywords,
        tags,
        minPrice,
        maxPrice,
        size,
        brandId: brandId || null,
        condition,
        minRating,
        userId: req.user!.id,
        category,
        subcategory,
        color,
        material,
        pattern,
        shippingCountry,
        catalogId,
        catalog,
        gender,
        status,
        clothingSize,
        shoeSize,
        shoeSizeSystem,
        clothingType,
        season,
        style,
        isActive,
        autoActions: autoActions ? {
          create: {
            autoFavorite: autoActions.autoFavorite || false,
            autoOffer: autoActions.autoOffer || false,
            autoOfferPrice: autoActions.autoOfferPrice !== undefined && autoActions.autoOfferPrice !== null ? autoActions.autoOfferPrice : undefined,
            autoBuy: autoActions.autoBuy || false
          }
        } : undefined
      },
      include: {
        autoActions: true,
        brand: true
      }
    });

    res.status(201).json({
      status: 'success',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profiles = await prisma.searchProfile.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        autoActions: true,
        brand: true,
        _count: {
          select: {
            matches: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: { profiles }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const profile = await prisma.searchProfile.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        autoActions: true,
        matches: {
          orderBy: {
            matchedAt: 'desc'
          },
          take: 50
        }
      }
    });

    if (!profile) {
      throw new AppError(404, 'Search profile not found');
    }

    res.json({
      status: 'success',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      keywords,
      tags,
      minPrice,
      maxPrice,
      size,
      brandId,
      condition,
      minRating,
      isActive,
      autoActions
    } = req.body;

    // If brandId is provided, validate that it exists
    if (brandId) {
      const brandExists = await prisma.brand.findUnique({
        where: { id: brandId }
      });
      if (!brandExists) {
        throw new AppError(400, 'Invalid brand ID');
      }
    }

    const profile = await prisma.searchProfile.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        autoActions: true
      }
    });

    if (!profile) {
      throw new AppError(404, 'Search profile not found');
    }

    const updatedProfile = await prisma.searchProfile.update({
      where: { id },
      data: {
        name,
        keywords,
        tags,
        minPrice,
        maxPrice,
        size,
        brandId: brandId || null,
        condition,
        minRating,
        isActive,
        autoActions: autoActions ? {
          upsert: {
            create: {
              autoFavorite: autoActions.autoFavorite || false,
              autoOffer: autoActions.autoOffer || false,
              autoOfferPrice: autoActions.autoOfferPrice,
              autoBuy: autoActions.autoBuy || false
            },
            update: {
              autoFavorite: autoActions.autoFavorite || false,
              autoOffer: autoActions.autoOffer || false,
              autoOfferPrice: autoActions.autoOfferPrice,
              autoBuy: autoActions.autoBuy || false
            }
          }
        } : undefined
      },
      include: {
        autoActions: true,
        brand: true
      }
    });

    res.json({
      status: 'success',
      data: { profile: updatedProfile }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const profile = await prisma.searchProfile.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!profile) {
      throw new AppError(404, 'Search profile not found');
    }

    await prisma.searchProfile.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const createSearchProfile = async (req: Request, res: Response) => {
  try {
    const { 
      name,
      keywords,
      category,
      subcategory,
      brand,
      size,
      minPrice,
      maxPrice,
      condition,
      color,
      material,
      pattern,
      shippingCountry,
      catalogId,
      catalog,
      gender,
      status,
      clothingSize,
      shoeSize,
      shoeSizeSystem,
      clothingType,
      season,
      style
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchProfile = await prisma.searchProfile.create({
      data: {
        userId,
        name,
        keywords,
        category,
        subcategory,
        brand,
        size,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        condition,
        color,
        material,
        pattern,
        shippingCountry,
        catalogId,
        catalog,
        gender,
        status: status || 'active',
        clothingSize,
        shoeSize,
        shoeSizeSystem,
        clothingType,
        season,
        style
      }
    });

    res.status(201).json(searchProfile);
  } catch (error) {
    console.error('Error creating search profile:', error);
    res.status(500).json({ error: 'Failed to create search profile' });
  }
};

export const getSearchProfiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchProfiles = await prisma.searchProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(searchProfiles);
  } catch (error) {
    console.error('Error fetching search profiles:', error);
    res.status(500).json({ error: 'Failed to fetch search profiles' });
  }
};

export const updateSearchProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchProfile = await prisma.searchProfile.findUnique({
      where: { id }
    });

    if (!searchProfile || searchProfile.userId !== userId) {
      return res.status(404).json({ error: 'Search profile not found' });
    }

    const updatedProfile = await prisma.searchProfile.update({
      where: { id },
      data: req.body
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating search profile:', error);
    res.status(500).json({ error: 'Failed to update search profile' });
  }
};

export const deleteSearchProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchProfile = await prisma.searchProfile.findUnique({
      where: { id }
    });

    if (!searchProfile || searchProfile.userId !== userId) {
      return res.status(404).json({ error: 'Search profile not found' });
    }

    await prisma.searchProfile.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting search profile:', error);
    res.status(500).json({ error: 'Failed to delete search profile' });
  }
}; 