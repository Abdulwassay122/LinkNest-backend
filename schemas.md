# Bookmark Manager Database Schema

## User

| Field | Type | Required |
|------|------|----------|
| id | Int | Yes |
| name | String | No |
| email | String | Yes |
| password | String | No |
| provider | AuthProvider | Yes |
| providerId | String | No |
| profileImage | String | No |
| role | String | Yes |
| createdAt | DateTime | Yes |
| updatedAt | DateTime | Yes |

---

## Collection

| Field | Type | Required |
|------|------|----------|
| id | Int | Yes |
| name | String | Yes |
| description | String | No |
| logo | String | No |
| userId | Int | Yes |
| createdAt | DateTime | Yes |
| updatedAt | DateTime | Yes |

---

## Bookmark

| Field | Type | Required |
|------|------|----------|
| id | Int | Yes |
| name | String | Yes |
| description | String | No |
| link | String | Yes |
| icon | String | No |
| type | BookmarkType | Yes |
| userId | Int | Yes |
| collectionId | Int | No |
| isFavorite | Boolean | No |
| position | Int | No |
| createdAt | DateTime | Yes |
| updatedAt | DateTime | Yes |

---

## Tag

| Field | Type | Required |
|------|------|----------|
| id | Int | Yes |
| name | String | Yes |

---

## BookmarkTag

| Field | Type | Required |
|------|------|----------|
| bookmarkId | Int | Yes |
| tagId | Int | Yes |

---

# Enums

## AuthProvider

- local
- google
- github
- facebook

---

## BookmarkType

- link
- article
- video
- github
- tool

---

# Relations

- **User → Collection** : One-to-Many  
- **User → Bookmark** : One-to-Many  
- **Collection → Bookmark** : One-to-Many  
- **Bookmark → Tag** : Many-to-Many (via `BookmarkTag`)  