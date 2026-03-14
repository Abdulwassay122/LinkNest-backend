import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";

// =====================
// Create Collection Controller
// =====================
export const createCollection = asyncHandler(async (req, res) => {
    const { name, description, logo } = req.body;

    // Validation
    if (!name) {
        throw new ApiError(400, "Collection name is required");
    }

    // Create collection
    const collection = await prisma.collection.create({
        data: {
            name,
            description: description || null,
            logo: logo || null,
            userId: req.user.id,
        },
        include: {
            bookmarks: {
                select: {
                    id: true,
                    name: true,
                    link: true,
                    type: true,
                    isFavorite: true,
                },
            },
            _count: {
                select: {
                    bookmarks: true,
                },
            },
        },
    });

    return res
        .status(201)
        .json(new ApiResponse(201, collection, "Collection created successfully"));
});

// =====================
// Get All Collections Controller
// =====================
export const getAllCollections = asyncHandler(async (req, res) => {
    const { search } = req.query;

    // Build filter object
    const where = {
        userId: req.user.id,
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    const collections = await prisma.collection.findMany({
        where,
        include: {
            bookmarks: {
                select: {
                    id: true,
                    name: true,
                    link: true,
                    type: true,
                    isFavorite: true,
                },
            },
            _count: {
                select: {
                    bookmarks: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, collections, "Collections fetched successfully"));
});

// =====================
// Get Collection By ID Controller
// =====================
export const getCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    const collection = await prisma.collection.findFirst({
        where: {
            id: parseInt(collectionId),
            userId: req.user.id,
        },
        include: {
            bookmarks: {
                include: {
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
            },
            _count: {
                select: {
                    bookmarks: true,
                },
            },
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, collection, "Collection fetched successfully"));
});

// =====================
// Update Collection Controller
// =====================
export const updateCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { name, description, logo } = req.body;

    // Check if collection exists and belongs to user
    const existingCollection = await prisma.collection.findFirst({
        where: {
            id: parseInt(collectionId),
            userId: req.user.id,
        },
    });

    if (!existingCollection) {
        throw new ApiError(404, "Collection not found");
    }

    // Update collection
    const collection = await prisma.collection.update({
        where: { id: parseInt(collectionId) },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(logo !== undefined && { logo }),
        },
        include: {
            bookmarks: {
                select: {
                    id: true,
                    name: true,
                    link: true,
                    type: true,
                    isFavorite: true,
                },
            },
            _count: {
                select: {
                    bookmarks: true,
                },
            },
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, collection, "Collection updated successfully"));
});

// =====================
// Delete Collection Controller
// =====================
export const deleteCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    // Check if collection exists and belongs to user
    const existingCollection = await prisma.collection.findFirst({
        where: {
            id: parseInt(collectionId),
            userId: req.user.id,
        },
    });

    if (!existingCollection) {
        throw new ApiError(404, "Collection not found");
    }

    // Delete collection (bookmarks will be set to null collectionId due to onDelete: SetNull)
    await prisma.collection.delete({
        where: { id: parseInt(collectionId) },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Collection deleted successfully"));
});

// =====================
// Add Bookmark to Collection Controller
// =====================
export const addBookmarkToCollection = asyncHandler(async (req, res) => {
    const { collectionId, bookmarkId } = req.params;

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
        where: {
            id: parseInt(collectionId),
            userId: req.user.id,
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

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

    // Update bookmark to add to collection
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: parseInt(bookmarkId) },
        data: {
            collectionId: parseInt(collectionId),
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
        .json(new ApiResponse(200, updatedBookmark, "Bookmark added to collection successfully"));
});

// =====================
// Remove Bookmark from Collection Controller
// =====================
export const removeBookmarkFromCollection = asyncHandler(async (req, res) => {
    const { collectionId, bookmarkId } = req.params;

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
        where: {
            id: parseInt(collectionId),
            userId: req.user.id,
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

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

    // Check if bookmark belongs to this collection
    if (bookmark.collectionId !== parseInt(collectionId)) {
        throw new ApiError(400, "Bookmark is not in this collection");
    }

    // Remove bookmark from collection
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: parseInt(bookmarkId) },
        data: {
            collectionId: null,
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
        .json(new ApiResponse(200, updatedBookmark, "Bookmark removed from collection successfully"));
});
