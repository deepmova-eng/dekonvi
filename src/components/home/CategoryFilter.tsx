import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../../config/categories';
import '../../search-categories.css';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      navigate('/categories');
    } else {
      onSelectCategory(categoryId);
    }
  };

  return (
    <div className="categories-section">
      <div className="categories-grid">
        {[...categories, { id: 'all', name: 'Toutes', icon: MoreHorizontal }].map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id && category.id !== 'all';

          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`category-card ${isActive ? 'active' : ''}`}
              data-category={category.id}
            >
              <div className="category-icon">
                <Icon />
              </div>
              <span className="category-label">{category.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}