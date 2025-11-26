import { useState } from 'react'
import { Grid, Package, Smartphone, Home, Car, Shirt, Book, Check } from 'lucide-react'
import './StepCategory.css'

interface Props {
    data: any
    updateData: (field: string, value: any) => void
}

const CATEGORIES = [
    {
        id: 'electronics',
        name: 'Électronique',
        icon: Smartphone,
        color: '#3B82F6',
        subcategories: [
            'Smartphones',
            'Ordinateurs portables',
            'Tablettes',
            'TV & Audio',
            'Appareils photo',
            'Consoles de jeux',
            'Accessoires',
            'Autre'
        ]
    },
    {
        id: 'fashion',
        name: 'Mode',
        icon: Shirt,
        color: '#EC4899',
        subcategories: [
            'Vêtements homme',
            'Vêtements femme',
            'Vêtements enfant',
            'Chaussures',
            'Sacs & Bagages',
            'Montres & Bijoux',
            'Accessoires',
            'Autre'
        ]
    },
    {
        id: 'home',
        name: 'Maison',
        icon: Home,
        color: '#10B981',
        subcategories: [
            'Meubles',
            'Décoration',
            'Électroménager',
            'Literie',
            'Luminaires',
            'Jardinage',
            'Bricolage',
            'Autre'
        ]
    },
    {
        id: 'vehicles',
        name: 'Véhicules',
        icon: Car,
        color: '#F59E0B',
        subcategories: [
            'Voitures',
            'Motos',
            'Scooters',
            'Vélos',
            'Pièces détachées',
            'Accessoires auto',
            'Autre'
        ]
    },
    {
        id: 'books',
        name: 'Livres & Loisirs',
        icon: Book,
        color: '#8B5CF6',
        subcategories: [
            'Livres',
            'BD & Mangas',
            'Jeux de société',
            'Instruments musique',
            'Sport',
            'DVD & Blu-ray',
            'Autre'
        ]
    },
    {
        id: 'other',
        name: 'Autre',
        icon: Package,
        color: '#6B7280',
        subcategories: [
            'Jouets & Jeux',
            'Animaux',
            'Services',
            'Immobilier',
            'Emploi',
            'Autre'
        ]
    },
]

export function StepCategory({ data, updateData }: Props) {
    const selectedCategory = CATEGORIES.find(cat => cat.id === data.category)

    const handleCategorySelect = (categoryId: string) => {
        updateData('category', categoryId)
        // Reset subcategory when changing category
        updateData('subcategory', '')
    }

    const handleSubcategorySelect = (subcategory: string) => {
        updateData('subcategory', subcategory)
    }

    return (
        <div className="step-category">
            <div className="step-header">
                <Grid size={32} className="step-icon" />
                <h2>Quelle catégorie correspond à votre article ?</h2>
                <p>Choisissez la catégorie qui correspond le mieux</p>
            </div>

            {/* Catégories principales */}
            <div className="category-grid">
                {CATEGORIES.map(category => {
                    const Icon = category.icon
                    const isSelected = data.category === category.id

                    return (
                        <button
                            key={category.id}
                            className={`category-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCategorySelect(category.id)}
                            style={{
                                '--category-color': category.color
                            } as any}
                        >
                            <div className="category-icon" style={{ background: category.color }}>
                                <Icon size={28} />
                            </div>
                            <span className="category-name">{category.name}</span>
                            {isSelected && (
                                <div className="category-check">
                                    <Check size={16} />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Sous-catégories (apparaissent après sélection) */}
            {selectedCategory && (
                <div className="subcategory-section">
                    <div className="subcategory-header">
                        <h3>Précisez la sous-catégorie</h3>
                        <p>Pour {selectedCategory.name.toLowerCase()}</p>
                    </div>

                    <div className="subcategory-grid">
                        {selectedCategory.subcategories.map((subcategory, index) => {
                            const isSelected = data.subcategory === subcategory

                            return (
                                <button
                                    key={subcategory}
                                    className={`subcategory-chip ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSubcategorySelect(subcategory)}
                                    style={{
                                        animationDelay: `${index * 0.05}s`,
                                        '--category-color': selectedCategory.color
                                    } as any}
                                >
                                    <span>{subcategory}</span>
                                    {isSelected && (
                                        <Check size={14} strokeWidth={3} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
