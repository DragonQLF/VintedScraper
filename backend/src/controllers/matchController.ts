import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';

export const getMatches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId, sortBy = 'newest', condition } = req.query;

    // Map numeric IDs to their text values
    const conditionMap: { [key: string]: string } = {
      '6': 'Novo com etiquetas',
      '1': 'Novo sem etiquetas',
      '2': 'Muito bom',
      '3': 'Bom',
      '4': 'Satisfatório'
    };

    const where = {
      searchProfile: {
        userId: req.user!.id,
        ...(profileId && profileId !== 'all' ? { id: profileId as string } : {})
      },
      // Map the numeric ID to its text value for filtering
      ...(condition && condition !== '' ? { condition: conditionMap[condition as string] } : {})
    };

    const orderBy = {
      ...(sortBy === 'newest' && { matchedAt: 'desc' }),
      ...(sortBy === 'price-asc' && { price: 'asc' }),
      ...(sortBy === 'price-desc' && { price: 'desc' })
    };

    const matches = await prisma.match.findMany({
      where,
      orderBy,
      include: {
        searchProfile: {
          select: {
            id: true,
            name: true
          }
        },
        actions: {
          select: {
            id: true,
            type: true,
            status: true,
            price: true
          }
        },
        priceHistory: {
          orderBy: {
            timestamp: 'asc'
          },
          select: {
            price: true,
            timestamp: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: { matches }
    });
  } catch (error) {
    next(error);
  }
};

export const createAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { matchId, type, price } = req.body;

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        searchProfile: {
          userId: req.user!.id
        }
      }
    });

    if (!match) {
      throw new AppError(404, 'Match not found');
    }

    const action = await prisma.action.create({
      data: {
        type,
        price,
        status: 'PENDING',
        userId: req.user!.id,
        matchId
      }
    });

    res.status(201).json({
      status: 'success',
      data: { action }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteMatches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body; // Expecting an array of match IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(400, 'Invalid or empty array of IDs provided');
    }

    // Ensure the user owns these matches before deleting
    const userMatches = await prisma.match.findMany({
      where: {
        id: { in: ids },
        searchProfile: {
          userId: req.user!.id,
        },
      },
      select: { id: true }, // Select only the IDs of matches the user owns
    });

    const userMatchIds = userMatches.map(match => match.id);

    // Filter out any IDs from the request that the user does not own
    const deletableIds = ids.filter((id: string) => userMatchIds.includes(id));

    if (deletableIds.length === 0) {
       // If the user provided IDs but none belonged to them, or the original IDs were invalid after filtering
       if(ids.length > 0) {
         throw new AppError(403, 'You do not have permission to delete these matches');
       } else { // This case should be caught by the initial array check, but as a safeguard
          return res.json({ status: 'success', data: { count: 0 } });
       }
    }

    // Perform the bulk deletion
    const deleteResult = await prisma.match.deleteMany({
      where: {
        id: { in: deletableIds },
        // Adding userId check again for an extra layer of safety, though filteredIds should cover this
        searchProfile: {
          userId: req.user!.id,
        },
      },
    });

    res.json({
      status: 'success',
      data: { count: deleteResult.count },
      message: `${deleteResult.count} matches deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}; 