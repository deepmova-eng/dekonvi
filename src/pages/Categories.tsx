import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { categories } from '../config/categories';

export default function Categories() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Vérifier si on vient de la page de création d'annonce
  const isFromCreateListing = location.state?.from === 'createListing';

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleCategoryClick = (categoryId: string) => {
    if (isFromCreateListing) {
      // Pour CreateListing, retourner directement avec la catégorie
      navigate(-1, {
        state: {
          selectedCategory: categoryId,
          fromCategories: true,
          preserveFormData: true
        }
      });
    } else {
      // Pour navigation normale, afficher les sous-catégories
      setSelectedCategoryId(categoryId);
    }
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    // Naviguer vers Home avec les filtres
    navigate(`/?category=${selectedCategoryId}&subcategory=${subcategoryId}`);
  };

  const handleBack = () => {
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
    } else {
      navigate(-1);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Afficher les sous-catégories si une catégorie est sélectionnée
  if (selectedCategoryId && selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-[72px] bg-white z-50">
          <div className="flex items-center p-4 border-b">
            <button onClick={handleBack} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold flex-1 text-center">{selectedCategory.name}</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Subcategories List */}
        <div className="bg-white divide-y">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600">Choisissez une sous-catégorie</p>
          </div>
          {selectedCategory.subcategories.map((sub) => {
            const Icon = selectedCategory.icon;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubcategoryClick(sub.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-900 font-medium">{sub.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Afficher la liste des catégories
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-[72px] bg-white z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold flex-1 text-center">Catégories</h1>
          <button onClick={handleBack} className="absolute right-4">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une catégorie"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white divide-y">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-400">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-gray-900">{category.name}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}