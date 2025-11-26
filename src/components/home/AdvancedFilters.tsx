import { useState } from 'react';
import { SlidersHorizontal, X, MapPin } from 'lucide-react';
import PriceRangeSlider from '../common/PriceRangeSlider';
import './AdvancedFilters.css';

export interface FilterValues {
    minPrice?: number;
    maxPrice?: number;
    location?: string;
}

interface AdvancedFiltersProps {
    filters: FilterValues;
    onChange: (filters: FilterValues) => void;
    onReset: () => void;
}

const MAX_PRICE = 10000000; // 10 millions FCFA

export default function AdvancedFilters({ filters, onChange, onReset }: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handlePriceChange = (min: number, max: number) => {
        onChange({
            ...filters,
            minPrice: min === 0 ? undefined : min,
            maxPrice: max === MAX_PRICE ? undefined : max,
        });
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...filters,
            location: e.target.value || undefined,
        });
    };

    const handleReset = () => {
        onReset();
        setIsOpen(false);
    };

    const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.location;

    return (
        <div className="advanced-filters">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`advanced-filters__toggle ${isOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
            >
                <SlidersHorizontal size={18} />
                <span>Filtres</span>
                {hasActiveFilters && (
                    <span className="advanced-filters__badge">{
                        [filters.minPrice, filters.maxPrice, filters.location].filter(Boolean).length
                    }</span>
                )}
            </button>

            {/* Filters Panel */}
            <div className={`advanced-filters__panel ${isOpen ? 'open' : ''}`}>
                <div className="advanced-filters__content">
                    {/* Header */}
                    <div className="advanced-filters__header">
                        <h3>Filtres avancés</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="advanced-filters__close"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Price Range */}
                    <div className="advanced-filters__section">
                        <label className="advanced-filters__label">Prix (FCFA)</label>
                        <PriceRangeSlider
                            min={0}
                            max={MAX_PRICE}
                            minValue={filters.minPrice || 0}
                            maxValue={filters.maxPrice || MAX_PRICE}
                            onChange={handlePriceChange}
                            formatValue={(val) => {
                                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                                return val.toString();
                            }}
                        />
                    </div>

                    {/* Location */}
                    <div className="advanced-filters__section">
                        <label className="advanced-filters__label">
                            <MapPin size={16} />
                            Localisation
                        </label>
                        <input
                            type="text"
                            value={filters.location || ''}
                            onChange={handleLocationChange}
                            placeholder="Ville ou quartier..."
                            className="advanced-filters__input"
                        />
                    </div>

                    {/* Actions */}
                    <div className="advanced-filters__actions">
                        <button
                            onClick={handleReset}
                            className="advanced-filters__reset"
                            disabled={!hasActiveFilters}
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="advanced-filters__overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
