# LinkNest API Documentation

**Base URL:** `http://localhost:8000`

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Bookmarks](#bookmarks)
- [Collections](#collections)
- [Tags](#tags)
- [Search](#search)

---

## Authentication

All routes require authentication unless specified otherwise. Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Auth Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/signup` | Register a new user | ❌ |
| `POST` | `/auth/login` | Login with email/password | ❌ |
| `POST` | `/auth/logout` | Logout user | ✅ |
| `GET` | `/auth/me` | Get current user info | ✅ |
| `POST` | `/auth/refresh` | Refresh access token | ✅ (refresh token) |
| `GET` | `/auth/oauth/google` | Initiate Google OAuth | ❌ |
| `GET` | `/auth/oauth/google/callback` | Google OAuth callback | ❌ |

---

### POST `/auth/signup`

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "local",
    "profileImage": null
  },
  "message": "User registered successfully"
}
```

---

### POST `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "local",
    "profileImage": null
  },
  "message": "User logged in successfully"
}
```

---

### POST `/auth/logout`

Logout the current user and clear tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "User logged out successfully"
}
```

---

### GET `/auth/me`

Get the current authenticated user's information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "local",
    "profileImage": null
  },
  "message": "User fetched successfully"
}
```

---

### POST `/auth/refresh`

Refresh the access token using the refresh token.

**Headers:**
```
Cookie: refreshToken=<refresh_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Token refreshed successfully"
}
```

---

### GET `/auth/oauth/google`

Initiate Google OAuth login flow. Redirects to Google's login page.

**Response:** Redirect to Google OAuth

---

### GET `/auth/oauth/google/callback`

Handle Google OAuth callback. Sets cookies and returns user info.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "google",
    "profileImage": "https://..."
  },
  "message": "Google login successful"
}
```

---

## Users

### User Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/users` | Create a new user | ❌ (optional) |
| `GET` | `/users/:userId` | Get user by ID | ✅ |
| `PATCH` | `/users/:userId` | Update user | ✅ |
| `DELETE` | `/users/:userId` | Delete user | ✅ |

---

### POST `/users`

Create a new user (admin function or public registration).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "user"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "local",
    "profileImage": null
  },
  "message": "User created successfully"
}
```

---

### GET `/users/:userId`

Get a user's profile by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "provider": "local",
    "profileImage": null,
    "createdAt": "2026-03-14T10:00:00.000Z",
    "updatedAt": "2026-03-14T10:00:00.000Z",
    "bookmarks": [...],
    "collections": [...]
  },
  "message": "User fetched successfully"
}
```

---

### PATCH `/users/:userId`

Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "profileImage": "https://example.com/image.jpg"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Updated Name",
    "role": "user",
    "provider": "local",
    "profileImage": "https://example.com/image.jpg"
  },
  "message": "User updated successfully"
}
```

---

### DELETE `/users/:userId`

Delete a user account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "User deleted successfully"
}
```

---

## Bookmarks

### Bookmark Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/bookmarks` | Get all bookmarks (with filters) | ✅ |
| `POST` | `/bookmarks` | Create a new bookmark | ✅ |
| `GET` | `/bookmarks/:bookmarkId` | Get bookmark by ID | ✅ |
| `PATCH` | `/bookmarks/:bookmarkId` | Update bookmark | ✅ |
| `DELETE` | `/bookmarks/:bookmarkId` | Delete bookmark | ✅ |
| `PATCH` | `/bookmarks/:bookmarkId/favorite` | Toggle favorite status | ✅ |

---

### GET `/bookmarks`

Get all bookmarks with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | int | Filter by collection ID |
| `type` | string | Filter by type (link, article, video, github, tool) |
| `isFavorite` | boolean | Filter favorites only |
| `search` | string | Search in name and description |
| `tag` | string | Filter by tag name |

**Example:**
```
GET /bookmarks?collectionId=1&type=article&isFavorite=true
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "My Bookmark",
      "description": "A cool bookmark",
      "link": "https://example.com",
      "icon": null,
      "type": "article",
      "isFavorite": true,
      "position": null,
      "createdAt": "2026-03-14T10:00:00.000Z",
      "updatedAt": "2026-03-14T10:00:00.000Z",
      "collection": {
        "id": 1,
        "name": "My Collection"
      },
      "tags": [
        {
          "tag": {
            "id": 1,
            "name": "javascript"
          }
        }
      ]
    }
  ],
  "message": "Bookmarks fetched successfully"
}
```

---

### POST `/bookmarks`

Create a new bookmark.

**Request Body:**
```json
{
  "name": "My Bookmark",
  "description": "A cool bookmark",
  "link": "https://example.com",
  "icon": "https://example.com/icon.png",
  "type": "article",
  "collectionId": 1,
  "isFavorite": false,
  "tags": ["javascript", "webdev"]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "name": "My Bookmark",
    "description": "A cool bookmark",
    "link": "https://example.com",
    "icon": "https://example.com/icon.png",
    "type": "article",
    "isFavorite": false,
    "collection": {
      "id": 1,
      "name": "My Collection"
    },
    "tags": [
      {
        "tag": {
          "id": 1,
          "name": "javascript"
        }
      }
    ],
    "createdAt": "2026-03-14T10:00:00.000Z",
    "updatedAt": "2026-03-14T10:00:00.000Z"
  },
  "message": "Bookmark created successfully"
}
```

---

### GET `/bookmarks/:bookmarkId`

Get a specific bookmark by ID.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "name": "My Bookmark",
    "description": "A cool bookmark",
    "link": "https://example.com",
    "type": "article",
    "isFavorite": true,
    "collection": {...},
    "tags": [...]
  },
  "message": "Bookmark fetched successfully"
}
```

---

### PATCH `/bookmarks/:bookmarkId`

Update a bookmark.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isFavorite": true,
  "tags": ["updated", "tags"]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Bookmark updated successfully"
}
```

---

### DELETE `/bookmarks/:bookmarkId`

Delete a bookmark.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Bookmark deleted successfully"
}
```

---

### PATCH `/bookmarks/:bookmarkId/favorite`

Toggle the favorite status of a bookmark.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Bookmark added to favorites"
}
```

---

## Collections

### Collection Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/collections` | Get all collections | ✅ |
| `POST` | `/collections` | Create a new collection | ✅ |
| `GET` | `/collections/:collectionId` | Get collection by ID | ✅ |
| `PATCH` | `/collections/:collectionId` | Update collection | ✅ |
| `DELETE` | `/collections/:collectionId` | Delete collection | ✅ |

---

### GET `/collections`

Get all collections for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name and description |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "My Collection",
      "description": "A collection of cool links",
      "logo": null,
      "userId": 1,
      "createdAt": "2026-03-14T10:00:00.000Z",
      "updatedAt": "2026-03-14T10:00:00.000Z",
      "bookmarks": [...],
      "_count": {
        "bookmarks": 5
      }
    }
  ],
  "message": "Collections fetched successfully"
}
```

---

### POST `/collections`

Create a new collection.

**Request Body:**
```json
{
  "name": "My Collection",
  "description": "A collection of cool links",
  "logo": "https://example.com/logo.png"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "name": "My Collection",
    "description": "A collection of cool links",
    "logo": "https://example.com/logo.png",
    "userId": 1,
    "bookmarks": [],
    "_count": {
      "bookmarks": 0
    }
  },
  "message": "Collection created successfully"
}
```

---

### GET `/collections/:collectionId`

Get a specific collection with its bookmarks.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "name": "My Collection",
    "description": "A collection of cool links",
    "bookmarks": [...],
    "_count": {
      "bookmarks": 5
    }
  },
  "message": "Collection fetched successfully"
}
```

---

### PATCH `/collections/:collectionId`

Update a collection.

**Request Body:**
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "logo": "https://example.com/new-logo.png"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Collection updated successfully"
}
```

---

### DELETE `/collections/:collectionId`

Delete a collection. Bookmarks in the collection will have their `collectionId` set to null.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Collection deleted successfully"
}
```

---

## Tags

### Tag Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/tags` | Get all tags | ✅ |
| `POST` | `/tags` | Create a new tag | ✅ |
| `GET` | `/tags/:tagId` | Get tag by ID | ✅ |
| `PATCH` | `/tags/:tagId` | Update tag | ✅ |
| `DELETE` | `/tags/:tagId` | Delete tag | ✅ |
| `POST` | `/bookmarks/:bookmarkId/tags/:tagId` | Add tag to bookmark | ✅ |
| `DELETE` | `/bookmarks/:bookmarkId/tags/:tagId` | Remove tag from bookmark | ✅ |

---

### GET `/tags`

Get all tags.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search tag names |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "javascript",
      "bookmarks": [...],
      "_count": {
        "bookmarks": 5
      }
    }
  ],
  "message": "Tags fetched successfully"
}
```

---

### POST `/tags`

Create a new tag.

**Request Body:**
```json
{
  "name": "javascript"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "name": "javascript",
    "bookmarks": [],
    "_count": {
      "bookmarks": 0
    }
  },
  "message": "Tag created successfully"
}
```

---

### GET `/tags/:tagId`

Get a specific tag with its bookmarks.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "name": "javascript",
    "bookmarks": [...],
    "_count": {
      "bookmarks": 5
    }
  },
  "message": "Tag fetched successfully"
}
```

---

### PATCH `/tags/:tagId`

Update a tag.

**Request Body:**
```json
{
  "name": "updated-tag-name"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Tag updated successfully"
}
```

---

### DELETE `/tags/:tagId`

Delete a tag. This removes the tag from all bookmarks.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Tag deleted successfully"
}
```

---

### POST `/bookmarks/:bookmarkId/tags/:tagId`

Add a tag to a bookmark.

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "bookmarkId": 1,
    "tagId": 1,
    "tag": {
      "id": 1,
      "name": "javascript"
    }
  },
  "message": "Tag added to bookmark successfully"
}
```

---

### DELETE `/bookmarks/:bookmarkId/tags/:tagId`

Remove a tag from a bookmark.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Tag removed from bookmark successfully"
}
```

---

## Search

### Search Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/bookmarks/search` | Search bookmarks | ✅ |
| `GET` | `/collections/search` | Search collections | ✅ |
| `GET` | `/bookmarks/recent` | Get recent bookmarks | ✅ |
| `GET` | `/tags/popular` | Get popular tags | ✅ |

---

### GET `/bookmarks/search`

Search bookmarks by query.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | **Required.** Search query |
| `type` | string | Filter by type |
| `collectionId` | int | Filter by collection |
| `tag` | string | Filter by tag |
| `isFavorite` | boolean | Filter favorites |

**Example:**
```
GET /bookmarks/search?q=javascript&type=article&isFavorite=true
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Search completed successfully"
}
```

---

### GET `/bookmarks/recent`

Get recent bookmarks.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | int | Number of bookmarks (default: 10) |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Recent bookmarks fetched successfully"
}
```

---

### GET `/tags/popular`

Get popular tags (most used).

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Popular tags fetched successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "errors": []
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/missing token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `500` | Internal Server Error |

---

## Cookie Authentication

The API also supports cookie-based authentication. After login, the following cookies are set:

| Cookie | Duration | Description |
|--------|----------|-------------|
| `accessToken` | 15 minutes | JWT access token |
| `refreshToken` | 7 days | JWT refresh token |

**Cookie Options:**
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` (production) - Only sent over HTTPS
- `sameSite: none` (production) - Allows cross-origin requests

---

## Rate Limiting

*To be implemented*

---

## CORS

CORS is configured to allow requests from:
- Development: `http://localhost:3000`
- Production: Configured via `CORS_ORIGIN` environment variable
