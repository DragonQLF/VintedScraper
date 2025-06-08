"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSearchProfile = exports.updateSearchProfile = exports.getSearchProfiles = exports.createSearchProfile = exports.deleteProfile = exports.updateProfile = exports.getProfile = exports.getProfiles = exports.createProfile = void 0;
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
const createProfile = async (req, res, next) => {
    try {
        const { name, searchType = 'ADVANCED', keywords, minPrice, maxPrice, size, brandId, condition, autoActions, category, subcategory, color, material, pattern, shippingCountry, catalogId, catalog, gender, status = 'active', clothingSize, shoeSize, shoeSizeSystem, clothingType, season, style, isActive = true, priority = 'MEDIUM', } = req.body;
        // Validate search type
        if (searchType !== 'SIMPLE' && searchType !== 'ADVANCED') {
            throw new errorHandler_1.AppError(400, 'Invalid search type. Must be either SIMPLE or ADVANCED');
        }
        // For simple search, only keywords are required
        if (searchType === 'SIMPLE' && !keywords) {
            throw new errorHandler_1.AppError(400, 'Keywords are required for simple search');
        }
        // Validate priority
        if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
            throw new errorHandler_1.AppError(400, 'Invalid priority value. Must be LOW, MEDIUM, or HIGH');
        }
        // If brandId is provided, validate that it exists
        if (brandId) {
            const brandExists = await index_1.prisma.brand.findUnique({
                where: { id: brandId }
            });
            if (!brandExists) {
                throw new errorHandler_1.AppError(400, 'Invalid brand ID');
            }
        }
        const profile = await index_1.prisma.searchProfile.create({
            data: {
                name,
                keywords,
                minPrice,
                maxPrice,
                size,
                brandId: brandId || null,
                condition,
                userId: req.user.id,
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
                priority,
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
    }
    catch (error) {
        next(error);
    }
};
exports.createProfile = createProfile;
const getProfiles = async (req, res, next) => {
    try {
        const profiles = await index_1.prisma.searchProfile.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ],
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
    }
    catch (error) {
        next(error);
    }
};
exports.getProfiles = getProfiles;
const getProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await index_1.prisma.searchProfile.findFirst({
            where: {
                id,
                userId: req.user.id
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
            throw new errorHandler_1.AppError(404, 'Search profile not found');
        }
        res.json({
            status: 'success',
            data: { profile }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, keywords, minPrice, maxPrice, size, brandId, condition, isActive, autoActions, priority } = req.body;
        // Validate priority if provided
        if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
            throw new errorHandler_1.AppError(400, 'Invalid priority value. Must be LOW, MEDIUM, or HIGH');
        }
        // If brandId is provided, validate that it exists
        if (brandId) {
            const brandExists = await index_1.prisma.brand.findUnique({
                where: { id: brandId }
            });
            if (!brandExists) {
                throw new errorHandler_1.AppError(400, 'Invalid brand ID');
            }
        }
        const profile = await index_1.prisma.searchProfile.findFirst({
            where: {
                id,
                userId: req.user.id
            },
            include: {
                autoActions: true
            }
        });
        if (!profile) {
            throw new errorHandler_1.AppError(404, 'Search profile not found');
        }
        const updatedProfile = await index_1.prisma.searchProfile.update({
            where: { id },
            data: {
                name,
                keywords,
                minPrice,
                maxPrice,
                size,
                brandId: brandId || null,
                condition,
                isActive,
                priority,
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await index_1.prisma.searchProfile.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!profile) {
            throw new errorHandler_1.AppError(404, 'Search profile not found');
        }
        await index_1.prisma.searchProfile.delete({
            where: { id }
        });
        res.json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProfile = deleteProfile;
const createSearchProfile = async (req, res) => {
    try {
        const { name, keywords, category, subcategory, brand, size, minPrice, maxPrice, condition, color, material, pattern, shippingCountry, catalogId, catalog, gender, status, clothingSize, shoeSize, shoeSizeSystem, clothingType, season, style } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const searchProfile = await index_1.prisma.searchProfile.create({
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
    }
    catch (error) {
        console.error('Error creating search profile:', error);
        res.status(500).json({ error: 'Failed to create search profile' });
    }
};
exports.createSearchProfile = createSearchProfile;
const getSearchProfiles = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const searchProfiles = await index_1.prisma.searchProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(searchProfiles);
    }
    catch (error) {
        console.error('Error fetching search profiles:', error);
        res.status(500).json({ error: 'Failed to fetch search profiles' });
    }
};
exports.getSearchProfiles = getSearchProfiles;
const updateSearchProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const searchProfile = await index_1.prisma.searchProfile.findUnique({
            where: { id }
        });
        if (!searchProfile || searchProfile.userId !== userId) {
            return res.status(404).json({ error: 'Search profile not found' });
        }
        const updatedProfile = await index_1.prisma.searchProfile.update({
            where: { id },
            data: req.body
        });
        res.json(updatedProfile);
    }
    catch (error) {
        console.error('Error updating search profile:', error);
        res.status(500).json({ error: 'Failed to update search profile' });
    }
};
exports.updateSearchProfile = updateSearchProfile;
const deleteSearchProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const searchProfile = await index_1.prisma.searchProfile.findUnique({
            where: { id }
        });
        if (!searchProfile || searchProfile.userId !== userId) {
            return res.status(404).json({ error: 'Search profile not found' });
        }
        await index_1.prisma.searchProfile.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting search profile:', error);
        res.status(500).json({ error: 'Failed to delete search profile' });
    }
};
exports.deleteSearchProfile = deleteSearchProfile;
