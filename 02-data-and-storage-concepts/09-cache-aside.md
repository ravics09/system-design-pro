# Cache-Aside

> **In one line:** The application checks the cache first and populates it lazily on a miss.

## Overview

Cache-aside is the most common caching pattern. The application checks the cache first:

- On a **hit**, it returns the cached value.
- On a **miss**, it reads from the database, stores the result in the cache, and returns it.

The cache is populated lazily, only as data is requested.

## Key Idea

Cache-aside is the right default because it is simple, it naturally populates the cache with the data that is actually accessed, and it **degrades gracefully** when the cache is unavailable since the application falls back to the database.

---

_Notes: (add your own content here)_
