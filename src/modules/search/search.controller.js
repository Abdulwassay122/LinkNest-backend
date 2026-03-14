import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";

// =====================
// Global Search Controller
// =====================
export const search = asyncHandler(async (req, res) => {
    const { q, type, collectionId, tag, isFavorite } = req.query;

    if (!q || q.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }

    const searchQuery = q.trim();

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    // Apply filters
    if (type) {
        where.type = type;
    }

    if (collectionId) {
        where.collectionId = parseInt(collectionId);
    }

    if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === "true";
    }

    if (tag) {
        where.tags = {
            some: {
                tag: {
                    name: tag,
                },
            },
        };
    }

    // Add search condition
    where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { link: { contains: searchQuery, mode: "insensitive" } },
    ];

    // Search bookmarks
    const bookmarks = await prisma.bookmark.findMany({
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
    });

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarks, "Search completed successfully"));
});

// =====================
// Search Bookmarks by Name Controller
// =====================
export const searchByName = asyncHandler(async (req, res) => {
    const { name } = req.query;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Bookmark name is required for search");
    }

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
            name: { contains: name.trim(), mode: "insensitive" },
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
        .json(new ApiResponse(200, bookmarks, "Search by name completed successfully"));
});

// =====================
// Search Bookmarks by Description Controller
// =====================
export const searchByDescription = asyncHandler(async (req, res) => {
    const { description } = req.query;

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description is required for search");
    }

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
            description: { contains: description.trim(), mode: "insensitive" },
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
        .json(new ApiResponse(200, bookmarks, "Search by description completed successfully"));
});

// =====================
// Search Bookmarks by Link Controller
// =====================
export const searchByLink = asyncHandler(async (req, res) => {
    const { link } = req.query;

    if (!link || link.trim() === "") {
        throw new ApiError(400, "Link is required for search");
    }

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
            link: { contains: link.trim(), mode: "insensitive" },
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
        .json(new ApiResponse(200, bookmarks, "Search by link completed successfully"));
});

// =====================
// Filter Bookmarks Controller
// =====================
export const filterBookmarks = asyncHandler(async (req, res) => {
    const { type, collectionId, tagId, isFavorite, startDate, endDate } = req.query;

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    // Apply type filter
    if (type) {
        where.type = type;
    }

    // Apply collection filter
    if (collectionId) {
        where.collectionId = parseInt(collectionId);
    }

    // Apply favorite filter
    if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === "true";
    }

    // Apply date range filter
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
            where.createdAt.lte = new Date(endDate);
        }
    }

    // Apply tag filter
    if (tagId) {
        where.tags = {
            some: {
                tagId: parseInt(tagId),
            },
        };
    }

    const bookmarks = await prisma.bookmark.findMany({
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
    });

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarks, "Filter completed successfully"));
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
