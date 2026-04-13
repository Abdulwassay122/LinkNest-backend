import axios from "axios";
import * as cheerio from "cheerio";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";
import { 
    sanitizeUrl, 
    validateUrl, 
    validateName, 
    validateDescription,
    validateBookmarkType,
    validateId,
    validateTags,
    sanitizeTagName
} from "../../utils/validation.js";

// =====================
// Create Bookmark Controller
// =====================
export const createBookmark = asyncHandler(async (req, res) => {
    const { name, description, link, icon, type, collectionId, isFavorite, tags } = req.body;

    // Validation
    validateName(name);
    validateUrl(link);
    validateBookmarkType(type);
    validateTags(tags);
    
    const sanitizedLink = sanitizeUrl(link);

    // If collectionId is provided, verify it belongs to the user
    if (collectionId) {
        const validatedCollectionId = validateId(collectionId.toString(), 'Collection ID');
        const collection = await prisma.collection.findFirst({
            where: {
                id: validatedCollectionId,
                userId: req.user.id,
            },
        });

        if (!collection) {
            throw new ApiError(404, "Collection not found or you don't have access");
        }
    }

    // Validate and sanitize description
    const sanitizedDescription = validateDescription(description);
    
    // Sanitize tags
    const sanitizedTags = tags ? tags.map(tag => sanitizeTagName(tag)) : undefined;

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
        data: {
            name: name.trim(),
            description: sanitizedDescription,
            link: sanitizedLink,
            icon: icon || null,
            type: type || "link",
            isFavorite: isFavorite || false,
            userId: req.user.id,
            collectionId: collectionId ? validateId(collectionId.toString(), 'Collection ID') : null,
            tags: sanitizedTags && sanitizedTags.length > 0 ? {
                create: sanitizedTags.map(tagName => ({
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

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    const bookmark = await prisma.bookmark.findFirst({
        where: {
            id: validatedBookmarkId,
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

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
        where: {
            id: validatedBookmarkId,
            userId: req.user.id,
        },
    });

    if (!existingBookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Validate fields if provided
    if (name) validateName(name);
    if (link) validateUrl(link);
    validateBookmarkType(type);
    validateTags(tags);

    // If collectionId is provided, verify it belongs to the user
    if (collectionId !== undefined) {
        if (collectionId === null) {
            // Removing from collection is valid
        } else {
            const validatedCollectionId = validateId(collectionId.toString(), 'Collection ID');
            const collection = await prisma.collection.findFirst({
                where: {
                    id: validatedCollectionId,
                    userId: req.user.id,
                },
            });

            if (!collection) {
                throw new ApiError(404, "Collection not found or you don't have access");
            }
        }
    }

    // Validate and sanitize description
    const sanitizedDescription = description !== undefined ? validateDescription(description) : undefined;
    
    // Sanitize tags if provided
    const sanitizedTags = tags ? tags.map(tag => sanitizeTagName(tag)) : undefined;

    // Build update data object
    const updateData = {
        ...(name && { name: name.trim() }),
        ...(sanitizedDescription !== undefined && { description: sanitizedDescription }),
        ...(link && { link: sanitizeUrl(link) }),
        ...(icon !== undefined && { icon }),
        ...(type && { type }),
        ...(collectionId !== undefined && { 
            collectionId: collectionId === null ? null : validateId(collectionId.toString(), 'Collection ID') 
        }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(sanitizedTags && {
            tags: {
                deleteMany: {},
                create: sanitizedTags.map(tagName => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName },
                            create: { name: tagName },
                        },
                    },
                })),
            },
        }),
    };

    // Update bookmark
    const bookmark = await prisma.bookmark.update({
        where: { id: validatedBookmarkId },
        data: updateData,
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

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

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

    // Toggle favorite status
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: validatedBookmarkId },
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

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findFirst({
        where: {
            id: validatedBookmarkId,
            userId: req.user.id,
        },
    });

    if (!existingBookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    // Delete related BookmarkTag records first to avoid foreign key constraint
    await prisma.bookmarkTag.deleteMany({
        where: {
            bookmarkId: validatedBookmarkId,
        },
    });

    // Delete bookmark
    await prisma.bookmark.delete({
        where: { id: validatedBookmarkId },
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

    // Validate bookmark ID
    const validatedBookmarkId = validateId(bookmarkId, 'Bookmark ID');

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

    // Validation
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        throw new ApiError(400, "Tags array is required");
    }

    // Validate and sanitize tags
    validateTags(tags);
    const sanitizedTags = tags.map(tag => sanitizeTagName(tag));

    // Add tags to bookmark
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: validatedBookmarkId },
        data: {
            tags: {
                create: sanitizedTags.map(tagName => ({
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

    // Check if tag is associated with bookmark
    const existingAssociation = await prisma.bookmarkTag.findUnique({
        where: {
            bookmarkId_tagId: {
                bookmarkId: validatedBookmarkId,
                tagId: validatedTagId,
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
                bookmarkId: validatedBookmarkId,
                tagId: validatedTagId,
            },
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tag removed from bookmark successfully"));
});

// =====================
// Get Link Preview Controller
// =====================
export const getLinkPreview = asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!url) {
        throw new ApiError(400, "URL is required");
    }

    // Validate and sanitize URL to prevent SSRF attacks
    const sanitizedUrl = sanitizeUrl(url);
    
    if (!sanitizedUrl) {
        throw new ApiError(400, "Invalid URL. Only HTTP and HTTPS URLs are allowed");
    }

    try {
        const response = await axios.get(sanitizedUrl, {
            headers: {
                'User-Agent': 'LinkNest/1.0 Bookmark Manager',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 8000,
            maxRedirects: 5,
            // Prevent following redirects to private IPs
            validateStatus: (status) => status >= 200 && status < 400,
        });

        // Check if redirect led to a private IP
        if (response.request?.res?.socket) {
            const remoteAddress = response.request.res.socket.remoteAddress;
            if (remoteAddress) {
                const privateIpPatterns = [
                    /^10\./,
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                    /^192\.168\./,
                    /^169\.254\./,
                    /^0\./,
                    /^127\./,
                    /^::1$/,
                    /^fc00:/,
                    /^fe80:/,
                ];
                
                if (privateIpPatterns.some(pattern => pattern.test(remoteAddress))) {
                    throw new ApiError(400, "Redirect to private network not allowed");
                }
            }
        }

        const $ = cheerio.load(response.data);

        // Extract Open Graph metadata
        const preview = {
            title: $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="title"]').attr('content') || 
                   $('title').text().trim() || 'No title',
            description: $('meta[property="og:description"]').attr('content') || 
                         $('meta[name="description"]').attr('content') || 
                         '',
            image: $('meta[property="og:image"]').attr('content') || 
                   $('meta[property="og:image:url"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') || 
                   '',
            url: $('meta[property="og:url"]').attr('content') || url,
            siteName: $('meta[property="og:site_name"]').attr('content') || 
                      $('meta[name="application-name"]').attr('content') || 
                      '',
            type: $('meta[property="og:type"]').attr('content') || 'website',
            domain: new URL(url).hostname.replace('www.', ''),
        };

        return res
            .status(200)
            .json(new ApiResponse(200, preview, "Preview fetched successfully"));
    } catch (error) {
        console.error("Error fetching link preview:", error.message);
        
        // Return basic preview even if scraping fails
        const domain = new URL(url).hostname.replace('www.', '');
        return res
            .status(200)
            .json(new ApiResponse(200, {
                title: domain,
                description: '',
                image: '',
                url: url,
                siteName: '',
                type: 'website',
                domain: domain,
            }, "Basic preview generated"));
    }
});
