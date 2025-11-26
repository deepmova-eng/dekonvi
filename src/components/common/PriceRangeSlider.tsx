import { useState, useEffect } from 'react';
import './PriceRangeSlider.css';

interface PriceRangeSliderProps {
    min: number;
    max: number;
    minValue: number;
    maxValue: number;
    onChange: (min: number, max: number) => void;
    formatValue?: (value: number) => string;
}

export default function PriceRangeSlider({
    min,
    max,
    minValue,
    maxValue,
    onChange,
    formatValue = (val) => val.toLocaleString(),
}: PriceRangeSliderProps) {
    const [localMin, setLocalMin] = useState(minValue);
    const [localMax, setLocalMax] = useState(maxValue);

    useEffect(() => {
        setLocalMin(minValue);
        setLocalMax(maxValue);
    }, [minValue, maxValue]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const newMin = Math.min(value, localMax - 1);
        setLocalMin(newMin);
        onChange(newMin, localMax);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const newMax = Math.max(value, localMin + 1);
        setLocalMax(newMax);
        onChange(localMin, newMax);
    };

    const minPercent = ((localMin - min) / (max - min)) * 100;
    const maxPercent = ((localMax - min) / (max - min)) * 100;

    return (
        <div className="price-range-slider">
            <div className="price-range-slider__values">
                <span className="price-range-slider__value">
                    {formatValue(localMin)} FCFA
                </span>
                <span className="price-range-slider__separator">-</span>
                <span className="price-range-slider__value">
                    {formatValue(localMax)} FCFA
                </span>
            </div>

            <div className="price-range-slider__container">
                <div className="price-range-slider__track">
                    <div
                        className="price-range-slider__range"
                        style={{
                            left: `${minPercent}%`,
                            right: `${100 - maxPercent}%`,
                        }}
                    />
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localMin}
                    onChange={handleMinChange}
                    className="price-range-slider__input price-range-slider__input--min"
                />

                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localMax}
                    onChange={handleMaxChange}
                    className="price-range-slider__input price-range-slider__input--max"
                />
            </div>
        </div>
    );
}
