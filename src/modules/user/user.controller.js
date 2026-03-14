import bcrypt from "bcryptjs";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";

// =====================
// Create User Controller
// =====================
export const createUser = asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || null,
            role: role || "user",
            provider: "local",
        },
    });

    // Return user data (excluding sensitive info)
    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
        profileImage: user.profileImage,
    };

    return res
        .status(201)
        .json(new ApiResponse(201, userResponse, "User created successfully"));
});

// =====================
// Get User Controller
// =====================
export const getUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Allow users to get their own info or admins to get any user
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
        throw new ApiError(403, "Forbidden - You can only access your own profile");
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            provider: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
            bookmarks: {
                select: {
                    id: true,
                    name: true,
                    link: true,
                    type: true,
                    isFavorite: true,
                },
            },
            collections: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
});

// =====================
// Update User Controller
// =====================
export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { name, profileImage } = req.body;

    // Allow users to update their own profile or admins to update any user
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
        throw new ApiError(403, "Forbidden - You can only update your own profile");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
    });

    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

    // Update user
    const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
            ...(name && { name }),
            ...(profileImage && { profileImage }),
        },
    });

    // Return user data
    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
        profileImage: user.profileImage,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, userResponse, "User updated successfully"));
});

// =====================
// Delete User Controller
// =====================
export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Allow users to delete their own account or admins to delete any user
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
        throw new ApiError(403, "Forbidden - You can only delete your own account");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
    });

    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

    // Delete user (cascade will handle related bookmarks, collections, etc.)
    await prisma.user.delete({
        where: { id: parseInt(userId) },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "User deleted successfully"));
});
