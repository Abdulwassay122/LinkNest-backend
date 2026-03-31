import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";

// =====================
// Create Bookmark Controller
// =====================
export const createBookmark = asyncHandler(async (req, res) => {
    const { name, description, link, icon, type, collectionId, isFavorite, tags } = req.body;

    // Validation
    if (!name || !link) {
        throw new ApiError(400, "Name and link are required");
    }

    // Validate bookmark type if provided
    const validTypes = ["link", "article", "video", "github", "tool"];
    if (type && !validTypes.includes(type)) {
        throw new ApiError(400, `Invalid bookmark type. Must be one of: ${validTypes.join(", ")}`);
    }

    // If collectionId is provided, verify it belongs to the user
    if (collectionId) {
        const collection = await prisma.collection.findFirst({
            where: {
                id: parseInt(collectionId),
                userId: req.user.id,
            },
        });

        if (!collection) {
            throw new ApiError(404, "Collection not found or you don't have access");
        }
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
        data: {
            name,
            description: description || null,
            link,
            icon: icon || null,
            type: type || "link",
            isFavorite: isFavorite || false,
            userId: req.user.id,
            collectionId: collectionId ? parseInt(collectionId) : null,
            tags: tags ? {
                create: tags.map(tagName => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName },
                            create: { name: tagName },
                        },
                    },
                })),
            } : undefined,
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
    });

    return res
        .status(201)
        .json(new ApiResponse(201, bookmark, "Bookmark created successfully"));
});

// =====================
// Get All Bookmarks Controller
// =====================
export const getAllBookmarks = asyncHandler(async (req, res) => {
    const { collectionId, type, isFavorite, search, tag } = req.query;

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    if (collectionId) {
        where.collectionId = parseInt(collectionId);
    }

    if (type) {
        where.type = type;
    }

    if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === "true";
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
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
        .json(new ApiResponse(200, bookmarks, "Bookmarks fetched successfully"));
});

// =====================
// Get Bookmark By ID Controller
// =====================
export const getBookmark = asyncHandler(async (req, res) => {
    const { bookmarkId } = req.params;

    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
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
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, bookmark, "Bookmark fetched successfully"));
});

// =====================
// Update Bookmark Controller
// =====================
export const updateBookmark = asyncHandler(async (req, res) => {
    const { bookmarkId } = req.params;
    const { name, description, link, icon, type, collectionId, isFavorite, tags } = req.body;

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
            userId: req.user.id,
        },
    });

    if (!existingBookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Validate bookmark type if provided
    const validTypes = ["link", "article", "video", "github", "tool"];
    if (type && !validTypes.includes(type)) {
        throw new ApiError(400, `Invalid bookmark type. Must be one of: ${validTypes.join(", ")}`);
    }

    // If collectionId is provided, verify it belongs to the user
    if (collectionId) {
        const collection = await prisma.collection.findFirst({
            where: {
                id: parseInt(collectionId),
                userId: req.user.id,
            },
        });

        if (!collection) {
            throw new ApiError(404, "Collection not found or you don't have access");
        }
    }

    // Update bookmark
    const bookmark = await prisma.bookmark.update({
        where: { id: parseInt(bookmarkId) },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(link && { link }),
            ...(icon !== undefined && { icon }),
            ...(type && { type }),
            ...(collectionId !== undefined && { collectionId: parseInt(collectionId) }),
            ...(isFavorite !== undefined && { isFavorite }),
            ...(tags && {
                tags: {
                    deleteMany: {},
                    create: tags.map(tagName => ({
                        tag: {
                            connectOrCreate: {
                                where: { name: tagName },
                                create: { name: tagName },
                            },
                        },
                    })),
                },
            }),
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
    });

    return res
        .status(200)
        .json(new ApiResponse(200, bookmark, "Bookmark updated successfully"));
});

// =====================
// Toggle Favorite Controller
// =====================
export const toggleFavorite = asyncHandler(async (req, res) => {
    const { bookmarkId } = req.params;

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
            userId: req.user.id,
        },
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Toggle favorite status
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: parseInt(bookmarkId) },
        data: {
            isFavorite: !bookmark.isFavorite,
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
    });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedBookmark, `Bookmark ${updatedBookmark.isFavorite ? "added to" : "removed from"} favorites`));
});

// =====================
// Delete Bookmark Controller
// =====================
export const deleteBookmark = asyncHandler(async (req, res) => {
    const { bookmarkId } = req.params;

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
            userId: req.user.id,
        },
    });

    if (!existingBookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Delete bookmark
    await prisma.bookmark.delete({
        where: { id: parseInt(bookmarkId) },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Bookmark deleted successfully"));
});

// =====================
// Get Favorite Bookmarks Controller
// =====================
export const getFavoriteBookmarks = asyncHandler(async (req, res) => {
    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId: req.user.id,
            isFavorite: true,
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
        .json(new ApiResponse(200, bookmarks, "Favorite bookmarks fetched successfully"));
});

// =====================
// Add Tags to Bookmark Controller
// =====================
export const addTags = asyncHandler(async (req, res) => {
    const { bookmarkId } = req.params;
    const { tags } = req.body;

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
            userId: req.user.id,
        },
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Validation
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        throw new ApiError(400, "Tags array is required");
    }

    // Add tags to bookmark
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: parseInt(bookmarkId) },
        data: {
            tags: {
                create: tags.map(tagName => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName.toLowerCase() },
                            create: { name: tagName.toLowerCase() },
                        },
                    },
                })),
            },
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
    });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedBookmark, "Tags added to bookmark successfully"));
});

// =====================
// Remove Tag from Bookmark Controller
// =====================
export const removeTag = asyncHandler(async (req, res) => {
    const { bookmarkId, tagId } = req.params;

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: parseInt(bookmarkId),
            userId: req.user.id,
        },
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
        where: { id: parseInt(tagId) },
    });

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    // Check if tag is associated with bookmark
    const existingAssociation = await prisma.bookmarkTag.findUnique({
        where: {
            bookmarkId_tagId: {
                bookmarkId: parseInt(bookmarkId),
                tagId: parseInt(tagId),
            },
        },
    });

    if (!existingAssociation) {
        throw new ApiError(400, "Tag is not associated with this bookmark");
    }

    // Remove tag from bookmark
    await prisma.bookmarkTag.delete({
        where: {
            bookmarkId_tagId: {
                bookmarkId: parseInt(bookmarkId),
                tagId: parseInt(tagId),
            },
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tag removed from bookmark successfully"));
});
