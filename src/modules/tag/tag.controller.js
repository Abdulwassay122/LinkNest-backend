import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";
import { 
    validateTagName,
    validateId,
    sanitizeTagName
} from "../../utils/validation.js";

// =====================
// Create Tag Controller
// =====================
export const createTag = asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Validation
    validateTagName(name);
    
    const sanitizedName = sanitizeTagName(name);

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
        where: { name: sanitizedName },
    });

    if (existingTag) {
        throw new ApiError(409, "Tag with this name already exists");
    }

    // Create tag
    const tag = await prisma.tag.create({
        data: {
            name: sanitizedName,
        },
        include: {
            bookmarks: {
                select: {
                    bookmark: {
                        select: {
                            id: true,
                            name: true,
                            link: true,
                            type: true,
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

    return res
        .status(201)
        .json(new ApiResponse(201, tag, "Tag created successfully"));
});

// =====================
// Get All Tags Controller
// =====================
export const getAllTags = asyncHandler(async (req, res) => {
    const { search } = req.query;

    // Build filter object
    const where = {};

    if (search) {
        where.name = { contains: search.toLowerCase(), mode: "insensitive" };
    }

    const tags = await prisma.tag.findMany({
        where,
        include: {
            bookmarks: {
                select: {
                    bookmark: {
                        select: {
                            id: true,
                            name: true,
                            userId: true,
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
        orderBy: {
            name: "asc",
        },
    });

    // Filter to only show tags that have bookmarks for this user
    const userTags = tags
        .map(tag => ({
            ...tag,
            bookmarks: tag.bookmarks.filter(b => b.bookmark && b.bookmark.userId === req.user.id),
            _count: {
                bookmarks: tag.bookmarks.filter(b => b.bookmark && b.bookmark.userId === req.user.id).length,
            },
        }))
        .filter(tag => tag._count.bookmarks > 0);

    return res
        .status(200)
        .json(new ApiResponse(200, userTags, "Tags fetched successfully"));
});

// =====================
// Get Tag By ID Controller
// =====================
export const getTag = asyncHandler(async (req, res) => {
    const { tagId } = req.params;

    // Validate tag ID
    const validatedTagId = validateId(tagId, 'Tag ID');

    const tag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
        include: {
            bookmarks: {
                select: {
                    bookmark: {
                        select: {
                            id: true,
                            name: true,
                            link: true,
                            type: true,
                            isFavorite: true,
                            createdAt: true,
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

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    // Filter bookmarks to only include those belonging to the user
    const userBookmarks = tag.bookmarks
        .filter(b => b.bookmark && b.bookmark.userId === req.user.id)
        .map(b => b.bookmark);

    const response = {
        ...tag,
        bookmarks: userBookmarks,
        _count: {
            bookmarks: userBookmarks.length,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Tag fetched successfully"));
});

// =====================
// Update Tag Controller
// =====================
export const updateTag = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const { name } = req.body;

    // Validate tag ID
    const validatedTagId = validateId(tagId, 'Tag ID');

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
    });

    if (!existingTag) {
        throw new ApiError(404, "Tag not found");
    }

    // Check if new name already exists
    if (name) {
        validateTagName(name);
        const sanitizedName = sanitizeTagName(name);
        
        if (sanitizedName !== existingTag.name) {
            const duplicateTag = await prisma.tag.findUnique({
                where: { name: sanitizedName },
            });

            if (duplicateTag) {
                throw new ApiError(409, "Tag with this name already exists");
            }
            
            // Update tag with sanitized name
            const tag = await prisma.tag.update({
                where: { id: validatedTagId },
                data: { name: sanitizedName },
                include: {
                    bookmarks: {
                        select: {
                            bookmark: {
                                select: {
                                    id: true,
                                    name: true,
                                    link: true,
                                    type: true,
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
            
            return res
                .status(200)
                .json(new ApiResponse(200, tag, "Tag updated successfully"));
        }
    }
    
    // If no name or name unchanged, return existing tag
    const tag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
        include: {
            bookmarks: {
                select: {
                    bookmark: {
                        select: {
                            id: true,
                            name: true,
                            link: true,
                            type: true,
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

    return res
        .status(200)
        .json(new ApiResponse(200, tag, "Tag updated successfully"));
});

// =====================
// Delete Tag Controller
// =====================
export const deleteTag = asyncHandler(async (req, res) => {
    const { tagId } = req.params;

    // Validate tag ID
    const validatedTagId = validateId(tagId, 'Tag ID');

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
    });

    if (!existingTag) {
        throw new ApiError(404, "Tag not found");
    }

    // Delete tag (bookmarkTag relations will be deleted due to cascade)
    await prisma.tag.delete({
        where: { id: validatedTagId },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tag deleted successfully"));
});

// =====================
// Get Tag by Name Controller
// =====================
export const getTagByName = asyncHandler(async (req, res) => {
    const { tagName } = req.params;

    const tag = await prisma.tag.findUnique({
        where: { name: tagName.toLowerCase() },
        include: {
            bookmarks: {
                select: {
                    bookmark: {
                        select: {
                            id: true,
                            name: true,
                            link: true,
                            type: true,
                            isFavorite: true,
                            createdAt: true,
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

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    // Filter bookmarks to only include those belonging to the user
    const userBookmarks = tag.bookmarks
        .filter(b => b.bookmark && b.bookmark.userId === req.user.id)
        .map(b => b.bookmark);

    const response = {
        ...tag,
        bookmarks: userBookmarks,
        _count: {
            bookmarks: userBookmarks.length,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Tag fetched successfully"));
});

// =====================
// Add Tag to Bookmark Controller
// =====================
export const addTagToBookmark = asyncHandler(async (req, res) => {
    const { bookmarkId, tagId } = req.params;

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Validate tag ID
    const validatedTagId = validateId(tagId, 'Tag ID');

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

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
    });

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    // Check if tag is already associated with bookmark
    const existingAssociation = await prisma.bookmarkTag.findUnique({
        where: {
            bookmarkId_tagId: {
                bookmarkId: validatedBookmarkId,
                tagId: validatedTagId,
            },
        },
    });

    if (existingAssociation) {
        throw new ApiError(409, "Tag is already associated with this bookmark");
    }

    // Create bookmarkTag association
    const bookmarkTag = await prisma.bookmarkTag.create({
        data: {
            bookmarkId: validatedBookmarkId,
            tagId: validatedTagId,
        },
        include: {
            tag: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return res
        .status(201)
        .json(new ApiResponse(201, bookmarkTag, "Tag added to bookmark successfully"));
});

// =====================
// Remove Tag from Bookmark Controller
// =====================
export const removeTagFromBookmark = asyncHandler(async (req, res) => {
    const { bookmarkId, tagId } = req.params;

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Validate tag ID
    const validatedTagId = validateId(tagId, 'Tag ID');

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

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
        where: { id: validatedTagId },
    });

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    // Delete bookmarkTag association
    await prisma.bookmarkTag.delete({
        where: {
            bookmarkId_tagId: {
                bookmarkId: validatedBookmarkId,
                tagId: validatedTagId,
            },
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tag removed from bookmark successfully"));
});
