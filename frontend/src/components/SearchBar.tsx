import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { WikipediaArticle } from '../types';
import { debounce } from '../utils';
import { api } from '../services/api';

interface SearchBarProps {
  onArticleSelect?: (article: WikipediaArticle) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface SearchBarRef {
  clearSearch: () => void;
}

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ 
  onArticleSelect, 
  placeholder = "Search Wikipedia articles...",
  disabled = false 
}, ref) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikipediaArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { exploreFromNode, clearGraph, isLoading: graphLoading } = useGraphStore();

  // Exponer función para limpiar el search desde el componente padre
  useImperativeHandle(ref, () => ({
    clearSearch: () => {
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      setError(null);
    }
  }), []);

  const searchWikipedia = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.search(searchQuery);
      setResults(response.results || []);
      setShowDropdown(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      setIsTyping(false);
      searchWikipedia(searchQuery);
    }, 300),
    [searchWikipedia]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsTyping(true);
    debouncedSearch(value);
  };

  const handleResultClick = async (article: WikipediaArticle) => {
    setQuery(article.title);
    setShowDropdown(false);
    setResults([]);
    
    // Si se proporciona onArticleSelect, usarlo en lugar de exploreFromNode directamente
    if (onArticleSelect) {
      onArticleSelect(article);
    } else {
      // Fallback: usar exploreFromNode directamente
      if (!isTyping && !isLoading) {
        clearGraph();
        try {
          await exploreFromNode(article.title, 3, 60); // Incrementado: profundidad 3, máximo 60 nodos para grafo más rico
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to build graph');
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        
        {(isLoading || isTyping) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
        )}
      </div>

      {error && (
        <div className="flex items-center mt-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {results.map((article, index) => (
            <div
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                handleResultClick(article);
              }}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{article.title}</div>
            </div>
          ))}
        </div>
      )}

      {graphLoading && (
        <div className="mt-2 text-sm text-blue-600 flex items-center">
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
