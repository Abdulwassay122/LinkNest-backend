import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";
import { 
    sanitizeSearchQuery, 
    validateSearchQuery, 
    validateBookmarkType,
    validateId,
    validatePagination 
} from "../../utils/validation.js";

// =====================
// Global Search Controller
// =====================
export const search = asyncHandler(async (req, res) => {
    const { q, type, collectionId, tag, isFavorite, page, pageSize } = req.query;

    // Validate search query
    validateSearchQuery(q);
    const searchQuery = sanitizeSearchQuery(q);

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    // Apply filters with validation
    if (type) {
        validateBookmarkType(type);
        where.type = type.toLowerCase();
    }

    if (collectionId) {
        const validatedCollectionId = validateId(collectionId, 'Collection ID');
        where.collectionId = validatedCollectionId;
    }

    if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === 'true';
    }

    if (tag) {
        where.tags = {
            some: {
                tag: {
                    name: sanitizeSearchQuery(tag),
                },
            },
        };
    }

    // Validate pagination
    const { page: validPage, pageSize: validPageSize } = validatePagination(page, pageSize);
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Add search condition
    where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { link: { contains: searchQuery, mode: "insensitive" } },
    ];

    // Search bookmarks with pagination
    const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
            where,
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.bookmark.count({ where }),
    ]);

    const hasMore = skip + bookmarks.length < total;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: bookmarks,
            total,
            page: validPage,
            pageSize: validPageSize,
            hasMore,
        }, "Search completed successfully"));
});

// =====================
// Search Bookmarks by Name Controller
// =====================
export const searchByName = asyncHandler(async (req, res) => {
    const { name, page, pageSize } = req.query;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Bookmark name is required for search");
    }

    // Validate pagination
    const { page: validPage, pageSize: validPageSize } = validatePagination(page, pageSize);
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Sanitize search term
    const searchTerm = sanitizeSearchQuery(name);

    const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
            where: {
                userId: req.user.id,
                name: { contains: searchTerm, mode: "insensitive" },
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.bookmark.count({
            where: {
                userId: req.user.id,
                name: { contains: searchTerm, mode: "insensitive" },
            },
        }),
    ]);

    const hasMore = skip + bookmarks.length < total;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: bookmarks,
            total,
            page: validPage,
            pageSize: validPageSize,
            hasMore,
        }, "Search by name completed successfully"));
});

// =====================
// Search Bookmarks by Description Controller
// =====================
export const searchByDescription = asyncHandler(async (req, res) => {
    const { description, page, pageSize } = req.query;

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description is required for search");
    }

    // Validate pagination
    const { page: validPage, pageSize: validPageSize } = validatePagination(page, pageSize);
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Sanitize search term
    const searchTerm = sanitizeSearchQuery(description);

    const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
            where: {
                userId: req.user.id,
                description: { contains: searchTerm, mode: "insensitive" },
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.bookmark.count({
            where: {
                userId: req.user.id,
                description: { contains: searchTerm, mode: "insensitive" },
            },
        }),
    ]);

    const hasMore = skip + bookmarks.length < total;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: bookmarks,
            total,
            page: validPage,
            pageSize: validPageSize,
            hasMore,
        }, "Search by description completed successfully"));
});

// =====================
// Search Bookmarks by Link Controller
// =====================
export const searchByLink = asyncHandler(async (req, res) => {
    const { link, page, pageSize } = req.query;

    if (!link || link.trim() === "") {
        throw new ApiError(400, "Link is required for search");
    }

    // Validate pagination
    const { page: validPage, pageSize: validPageSize } = validatePagination(page, pageSize);
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Sanitize search term (don't use sanitizeUrl here as we're searching, not fetching)
    const searchTerm = sanitizeSearchQuery(link);

    const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
            where: {
                userId: req.user.id,
                link: { contains: searchTerm, mode: "insensitive" },
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.bookmark.count({
            where: {
                userId: req.user.id,
                link: { contains: searchTerm, mode: "insensitive" },
            },
        }),
    ]);

    const hasMore = skip + bookmarks.length < total;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: bookmarks,
            total,
            page: validPage,
            pageSize: validPageSize,
            hasMore,
        }, "Search by link completed successfully"));
});

// =====================
// Filter Bookmarks Controller
// =====================
export const filterBookmarks = asyncHandler(async (req, res) => {
    const { type, collectionId, tagId, isFavorite, startDate, endDate, page, pageSize } = req.query;

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    // Apply type filter with validation
    if (type) {
        validateBookmarkType(type);
        where.type = type.toLowerCase();
    }

    // Apply collection filter with validation
    if (collectionId) {
        const validatedCollectionId = validateId(collectionId, 'Collection ID');
        where.collectionId = validatedCollectionId;
    }

    // Apply favorite filter
    if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === 'true';
    }

    // Apply date range filter
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                throw new ApiError(400, "Invalid start date format");
            }
            where.createdAt.gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                throw new ApiError(400, "Invalid end date format");
            }
            where.createdAt.lte = end;
        }
    }

    // Apply tag filter with validation
    if (tagId) {
        const validatedTagId = validateId(tagId, 'Tag ID');
        where.tags = {
            some: {
                tagId: validatedTagId,
            },
        };
    }

    // Validate pagination
    const { page: validPage, pageSize: validPageSize } = validatePagination(page, pageSize);
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
            where,
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.bookmark.count({ where }),
    ]);

    const hasMore = skip + bookmarks.length < total;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: bookmarks,
            total,
            page: validPage,
            pageSize: validPageSize,
            hasMore,
        }, "Filter completed successfully"));
});

// =====================
// Get Bookmarks by Type Controller
// =====================
export const getByType = asyncHandler(async (req, res) => {
    const { type } = req.params;

    const validTypes = ["link", "article", "video", "github", "tool"];
    if (!validTypes.includes(type)) {
        throw new ApiError(400, `Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
            type,
        },
        include: {
            collection: {
                select: {
                    id: true,
                    name: true,
                },
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarks, `Bookmarks of type "${type}" fetched successfully`));
});

// =====================
// Get Recent Bookmarks Controller
// =====================
export const getRecentBookmarks = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
        },
        include: {
            collection: {
                select: {
                    id: true,
                    name: true,
                },
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: parseInt(limit),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarks, "Recent bookmarks fetched successfully"));
});

// =====================
// Get Statistics Controller
// =====================
export const getStatistics = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get total bookmarks count
    const totalBookmarks = await prisma.bookmark.count({
        where: { userId },
    });

    // Get favorites count
    const favoritesCount = await prisma.bookmark.count({
        where: { userId, isFavorite: true },
    });

    // Get collections count
    const totalCollections = await prisma.collection.count({
        where: { userId },
    });

    // Get tags count
    const totalTags = await prisma.tag.count();

    // Get bookmarks by type
    const bookmarksByType = await prisma.bookmark.groupBy({
        by: ["type"],
        where: { userId },
        _count: true,
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBookmarks = await prisma.bookmark.count({
        where: {
            userId,
            createdAt: {
                gte: sevenDaysAgo,
            },
        },
    });

    const statistics = {
        totalBookmarks,
        favoritesCount,
        totalCollections,
        totalTags,
        bookmarksByType: bookmarksByType.reduce((acc, item) => {
            acc[item.type] = item._count;
            return acc;
        }, {}),
        recentBookmarks: {
            count: recentBookmarks,
            period: "last 7 days",
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, statistics, "Statistics fetched successfully"));
});
