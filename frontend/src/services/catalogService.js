import { apiClient, buildQueryString } from './apiClient';

export const catalogService = {
  getCategories: () => apiClient('/categories'),
  
  getBooks: (params = {}) => apiClient(`/books${buildQueryString(params)}`),
  
  getProductById: (id) => apiClient(`/books/${id}`),
  
  getRecommendations: (title) => apiClient(`/recommend${buildQueryString({ title })}`),
  
  /*getAuthorBooks: (title) => apiClient(`/author${buildQueryString({ title })}`),*/
  getAuthorBooks: (title) => apiClient(`/same-author${buildQueryString({ title })}`),
  
  searchBooks: (q) => apiClient(`/search${buildQueryString({ q })}`),
  
  getTrending: (topN = 8) => apiClient(`/trending${buildQueryString({ top_n: topN })}`),
  
  getBestsellers: (topN = 8) => apiClient(`/bestsellers${buildQueryString({ top_n: topN })}`),
  
  getDeals: (topN = 8) => apiClient(`/deals${buildQueryString({ top_n: topN })}`)
};
