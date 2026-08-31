'use client';

import { createContext, useContext } from 'react';

/** Lets any title card open the details modal without prop-drilling. */
export const CatalogContext = createContext<{ open: (imdbID: string) => void }>({ open: () => {} });
export const useCatalog = () => useContext(CatalogContext);
