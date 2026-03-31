-- DropForeignKey
ALTER TABLE "BookmarkTag" DROP CONSTRAINT "BookmarkTag_bookmarkId_fkey";

-- AddForeignKey
ALTER TABLE "BookmarkTag" ADD CONSTRAINT "BookmarkTag_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
