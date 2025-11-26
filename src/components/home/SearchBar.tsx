import { useRef, useEffect } from 'react';
import { Search, Camera } from 'lucide-react';
import '../../search-categories.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="search-section">
      <div className="search-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Rechercher un produit ou une ville..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="search-icon-btn">
          <Search />
        </button>
        <button className="image-search-btn" title="Recherche par image">
          <Camera />
        </button>
      </div>
    </div>
  );
}