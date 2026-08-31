# Basic Level System Design Problems

Focus: API design, database modeling, clean architecture, data normalization, and standard Node.js mechanisms.

Each problem below links to its own file. This list is for practice and reference only — no implementation is included.

## Part 1 — Core Components & Schema Design

Focus: API design, Database modeling, and standard patterns.

1. [Design a User Authentication System](./01-user-authentication-system/01-user-authentication-system.md) — includes a full [implementation](./01-user-authentication-system/implementation/)
2. [Design a "Todo" List API](./02-todo-list-api/02-todo-list-api.md)
3. [Implement Pagination](./03-cursor-based-pagination/03-cursor-based-pagination.md)
4. [Design a URL Shortener (Schema)](./04-url-shortener-schema/04-url-shortener-schema.md)
5. [Rate Limiter Middleware](./05-rate-limiter-middleware/05-rate-limiter-middleware.md)
6. [Design a Comment System](./06-comment-system/06-comment-system.md)
7. [Image Upload Service](./07-image-upload-service/07-image-upload-service.md) — includes a full [implementation](./07-image-upload-service/implementation/)
8. [Design a Real-Time Notification System](./08-notification-feed/08-notification-feed.md) — includes a full [implementation](./08-notification-feed/implementation/)
9. [Design a Friend Request System](./09-friend-request-system/09-friend-request-system.md) — includes a full [implementation](./09-friend-request-system/implementation/)
10. [Design a Caching Layer System](./10-caching-layer/10-caching-layer.md) — includes a full [implementation](./10-caching-layer/implementation/)
11. [Design a Shopping Cart System](./11-shopping-cart/11-shopping-cart.md) — includes a full [implementation](./11-shopping-cart/implementation/)
12. [API Response Standardization](./12-api-response-standardization/12-api-response-standardization.md) — includes a full [implementation](./12-api-response-standardization/implementation/) (shared API platform: versioning + envelopes + tracing)
13. [Design a Job / Task Queue](./13-simple-job-queue/13-simple-job-queue.md) — includes a full [implementation](./13-simple-job-queue/implementation/) (leases + visibility timeout, retries + backoff, DLQ, priorities, delayed jobs, worker pool)
14. [Database Indexing](./14-database-indexing/14-database-indexing.md) — includes a full [implementation](./14-database-indexing/implementation/) (index vs full-scan planner + EXPLAIN)
15. [Config Management](./15-config-management/15-config-management.md) — includes a full [implementation](./15-config-management/implementation/) (layered resolver + provenance + secrets + flags + versioning)

## Part 2 — Clean Architecture & Data Normalization

Focus: Clean architecture, data normalization, and standard Node.js mechanisms.

16. [Design a Soft-Delete System](./16-soft-delete-system/16-soft-delete-system.md)
17. [Model a Product Catalog with Variants](./17-product-catalog-with-variants/17-product-catalog-with-variants.md) — includes a full [implementation](./17-product-catalog-with-variants/implementation/) (product + variant matrix + SKU resolution + inventory)
18. [Design a File Download Server](./18-file-download-server/18-file-download-server.md)
19. [Implement an API Versioning Strategy](./19-api-versioning-strategy/19-api-versioning-strategy.md) — see the shared [implementation](./19-api-versioning-strategy/implementation/)
20. [Design a User Profile Activity Log](./20-user-profile-activity-log/20-user-profile-activity-log.md)
21. [Implement Request Validation Middleware](./21-request-validation-middleware/21-request-validation-middleware.md)
22. [Design an Inventory Stock Ledger](./22-inventory-stock-ledger/22-inventory-stock-ledger.md)
23. [Model a Multi-Tenant Database Structure](./23-multi-tenant-database-structure/23-multi-tenant-database-structure.md)
24. [Design a Contact Form Submission System](./24-contact-form-submission-system/24-contact-form-submission-system.md)
25. [Implement a Token Refresh Mechanism](./25-token-refresh-mechanism/25-token-refresh-mechanism.md)
26. [Design a Coupon/Discount Code Engine](./26-coupon-discount-code-engine/26-coupon-discount-code-engine.md)
27. [Implement API Request Tracing](./27-api-request-tracing/27-api-request-tracing.md) — see the shared [implementation](./27-api-request-tracing/implementation/)
28. [Design a Media Metadata Storage System](./28-media-metadata-storage-system/28-media-metadata-storage-system.md)
29. [Implement Graceful Shutdown](./29-graceful-shutdown/29-graceful-shutdown.md)
30. [Design a Newsletter Subscription List](./30-newsletter-subscription-list/30-newsletter-subscription-list.md)
