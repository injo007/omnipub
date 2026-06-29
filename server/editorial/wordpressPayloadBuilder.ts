import { FinalArticlePackage, WordpressPayload } from "./typesPhaseD";

export function buildWordpressPayload(pkg: FinalArticlePackage): WordpressPayload {
    return {
        title: pkg.editorialContent.title,
        content: pkg.editorialContent.bodyHtml,
        excerpt: pkg.editorialContent.excerpt,
        slug: pkg.editorialContent.slug,
        status: pkg.packageStatus === "SCHEDULED" ? "future" : 
                pkg.packageStatus === "APPROVED_FOR_PUBLISHING" ? "publish" : "draft",
        date: pkg.publishingTarget.desiredPublishTime,
        author: pkg.publishingTarget.mappedAuthorId !== "INVALID" ? parseInt(pkg.publishingTarget.mappedAuthorId, 10) || 1 : 1,
        categories: pkg.publishingTarget.mappedCategoryIds.map(c => parseInt(c, 10)).filter(n => !isNaN(n)),
        tags: pkg.publishingTarget.mappedTagIds.map(t => parseInt(t, 10)).filter(n => !isNaN(n)),
        meta: pkg.seo ? { seo_title: pkg.seo.seoTitle, meta_description: pkg.seo.metaDescription } : undefined
    };
}
