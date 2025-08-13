import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { WikipediaArticle } from '../types';
import { debounce } from '../utils';

interface SearchBarProps {
  onArticleSelect?: (article: WikipediaArticle) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onArticleSelect,
  placeholder = "Buscar artículos de Wikipedia (ej: Albert Einstein, Python, Machine Learning)...",
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikipediaArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchArticles, exploreFromNode } = useGraphStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function to abort any pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Debounced search function to avoid too many API calls and allow cancellation
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim() || searchTerm.length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      // Cancelar búsqueda anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo controlador para esta búsqueda
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchArticles(searchTerm, 8);
        
        // Verificar si la búsqueda no fue cancelada
        if (!abortControllerRef.current.signal.aborted) {
          setResults(searchResults);
          setIsOpen(true);
        }
      } catch (err) {
        // Solo mostrar error si no fue por cancelación
        if (!abortControllerRef.current?.signal.aborted) {
          setError('Error al buscar artículos. Intenta de nuevo.');
          setResults([]);
          setIsOpen(false);
          console.error('Search error:', err);
        }
      } finally {
        // Solo cambiar estado de loading si no fue cancelado
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300),
    [searchArticles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Si el usuario sigue escribiendo, cancelar la búsqueda anterior
    // y empezar una nueva búsqueda debounced
    debouncedSearch(value);
  };

  const handleResultClick = async (article: WikipediaArticle) => {
    setQuery(article.title);
    setIsOpen(false);
    setResults([]);
    
    // Call the external handler if provided
    if (onArticleSelect) {
      onArticleSelect(article);
    }

    // Start graph exploration from this article
    try {
      await exploreFromNode(article.title, 3, 10);
    } catch (err) {
      setError('Error al explorar el grafo desde este artículo.');
      console.error('Exploration error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0]);
    }
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for result clicks
    setTimeout(() => setIsOpen(false), 200);
  };

  const clearSearch = () => {
    // Cancelar cualquier búsqueda pendiente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative" ref={searchRef}>
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled && !isLoading} // Solo deshabilitar si está explícitamente disabled, pero no durante la carga
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-12 py-4 text-lg
              border-2 rounded-xl shadow-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200 ease-in-out
              ${disabled && !isLoading
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
                : 'bg-white border-gray-300 hover:border-gray-400'
              }
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
            `}
          />

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          )}

          {/* Clear button */}
          {query && !isLoading && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
              type="button"
            >
              <div className="h-5 w-5 text-gray-400 hover:text-gray-600 flex items-center justify-center">
                ✕
              </div>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search Results Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </div>
              
              {results.map((article, index) => (
                <div
                  key={article.page_id || index}
                  className="p-3 hover:bg-blue-50 rounded-lg transition-colors group border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 group-hover:bg-blue-600 transition-colors" />
                    
                    <div className="flex-grow min-w-0">
                      <button
                        onClick={() => handleResultClick(article)}
                        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      >
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                          {article.title}
                        </h3>
                        
                        {article.summary && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                            {article.summary}
                          </p>
                        )}
                      </button>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          {article.page_id && (
                            <span>ID: {article.page_id}</span>
                          )}
                          <span 
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded cursor-pointer select-none"
                            onClick={() => handleResultClick(article)}
                          >
                            Explorar Grafo
                          </span>
                        </div>
                        
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver en Wikipedia →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {isOpen && !isLoading && query.length >= 3 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6 text-center">
            <div className="text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron artículos para "<strong>{query}</strong>"</p>
              <p className="text-xs mt-1">Intenta con términos más generales o en inglés</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Tips */}
      {query.length === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Sugerencias: <span className="font-medium text-blue-600">Albert Einstein</span>, 
            <span className="font-medium text-blue-600"> Python programming</span>, 
            <span className="font-medium text-blue-600"> Machine Learning</span>
          </p>
        </div>
      )}
    </div>
  );
};

export { SearchBar };
export default SearchBar;
