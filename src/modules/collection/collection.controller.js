import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";
import { 
    validateCollectionName, 
    validateDescription,
    validateId 
} from "../../utils/validation.js";

// =====================
// Create Collection Controller
// =====================
export const createCollection = asyncHandler(async (req, res) => {
    const { name, description, logo } = req.body;

    // Validation
    validateCollectionName(name);

    // Validate and sanitize description
    const sanitizedDescription = validateDescription(description);

    // Create collection
    const collection = await prisma.collection.create({
        data: {
            name: name.trim(),
            description: sanitizedDescription,
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

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    const collection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
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

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    // Check if collection exists and belongs to user
    const existingCollection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
            userId: req.user.id,
        },
    });

    if (!existingCollection) {
        throw new ApiError(404, "Collection not found");
    }

    // Validate fields if provided
    if (name) validateCollectionName(name);

    // Validate and sanitize description
    const sanitizedDescription = description !== undefined ? validateDescription(description) : undefined;

    // Update collection
    const collection = await prisma.collection.update({
        where: { id: validatedCollectionId },
        data: {
            ...(name && { name: name.trim() }),
            ...(sanitizedDescription !== undefined && { description: sanitizedDescription }),
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

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    // Check if collection exists and belongs to user
    const existingCollection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
            userId: req.user.id,
        },
    });

    if (!existingCollection) {
        throw new ApiError(404, "Collection not found");
    }

    // Delete collection (bookmarks will be set to null collectionId due to onDelete: SetNull)
    await prisma.collection.delete({
        where: { id: validatedCollectionId },
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

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
            userId: req.user.id,
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: validatedBookmarkId,
            userId: req.user.id,
        },
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Update bookmark to add to collection
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: validatedBookmarkId },
        data: {
            collectionId: validatedCollectionId,
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

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
            userId: req.user.id,
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: validatedBookmarkId,
            userId: req.user.id,
        },
    });

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Check if bookmark belongs to this collection
    if (bookmark.collectionId !== validatedCollectionId) {
        throw new ApiError(400, "Bookmark is not in this collection");
    }

    // Remove bookmark from collection
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: validatedBookmarkId },
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
"" 
// =====================
// Add Multiple Bookmarks to Collection Controller
// =====================
export const addBookmarksToCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { bookmarkIds } = req.body;

    // Validate collection ID
    const validatedCollectionId = validateId(collectionId, 'Collection ID');

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
            userId: req.user.id,
        },
    });

    if (!collection) {
        throw new ApiError(404, "Collection not found");
    }

    // Validation
    if (!bookmarkIds || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
        throw new ApiError(400, "Bookmark IDs array is required");
    }

    // Limit number of bookmarks to add at once
    if (bookmarkIds.length > 50) {
        throw new ApiError(400, "Cannot add more than 50 bookmarks at once");
    }

    // Validate all bookmark IDs
    const validatedBookmarkIds = bookmarkIds.map((id, index) => {
        try {
            return validateId(id.toString(), `Bookmark ID at index ${index}`);
        } catch {
            throw new ApiError(400, `Invalid bookmark ID at index ${index}`);
        }
    });

    // Verify all bookmarks belong to the user
    const bookmarks = await prisma.bookmark.findMany({
        where: {
            id: { in: validatedBookmarkIds },
            userId: req.user.id,
        },
    });

    if (bookmarks.length !== validatedBookmarkIds.length) {
        throw new ApiError(404, "One or more bookmarks not found");
    }

    // Update all bookmarks to add to collection
    await prisma.bookmark.updateMany({
        where: {
            id: { in: validatedBookmarkIds },
        },
        data: {
            collectionId: validatedCollectionId,
        },
    });

    // Return updated collection
    const updatedCollection = await prisma.collection.findFirst({
        where: {
            id: validatedCollectionId,
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
        .status(200)
        .json(new ApiResponse(200, updatedCollection, "Bookmarks added to collection successfully"));
});
