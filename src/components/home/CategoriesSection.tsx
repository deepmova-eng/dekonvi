import { useState, useEffect } from 'react'
import { Smartphone, Shirt, Home, Car, Book, Package } from 'lucide-react'
import { CategoryCard } from './CategoryCard'
import { supabase } from '../../lib/supabase'
import './CategoriesSection.css'

const CATEGORIES = [
    {
        id: 'electronics',
        name: 'Électronique',
        description: 'Smartphones, ordinateurs, TV...',
        icon: Smartphone,
        color: '#3B82F6',
        gradient: 'rgba(59, 130, 246, 0.15)',
    },
    {
        id: 'fashion',
        name: 'Mode',
        description: 'Vêtements, chaussures, accessoires...',
        icon: Shirt,
        color: '#EC4899',
        gradient: 'rgba(236, 72, 153, 0.15)',
    },
    {
        id: 'home',
        name: 'Maison',
        description: 'Meubles, décoration, électroménager...',
        icon: Home,
        color: '#10B981',
        gradient: 'rgba(16, 185, 129, 0.15)',
    },
    {
        id: 'vehicles',
        name: 'Véhicules',
        description: 'Voitures, motos, vélos...',
        icon: Car,
        color: '#F59E0B',
        gradient: 'rgba(245, 158, 11, 0.15)',
    },
    {
        id: 'books',
        name: 'Livres & Loisirs',
        description: 'Livres, jeux, instruments...',
        icon: Book,
        color: '#8B5CF6',
        gradient: 'rgba(139, 92, 246, 0.15)',
    },
    {
        id: 'other',
        name: 'Autre',
        description: 'Tout le reste...',
        icon: Package,
        color: '#6B7280',
        gradient: 'rgba(107, 114, 128, 0.15)',
    },
]

export function CategoriesSection() {
    const [counts, setCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        fetchCategoryCounts()
    }, [])

    const fetchCategoryCounts = async () => {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('category')
                .eq('status', 'active')

            if (error) throw error

            // Compte par catégorie (mapping DB -> frontend IDs)
            const countMap: Record<string, number> = {}

            // Mapping des catégories DB vers frontend
            const categoryMapping: Record<string, string> = {
                'high-tech': 'electronics',
                'mode': 'fashion',
                'maison': 'home',
                'vehicules': 'vehicles',
                'loisirs': 'books',
                'autres': 'other',
            }

            data.forEach((listing) => {
                const dbCat = listing.category
                const frontendCat = categoryMapping[dbCat] || dbCat
                countMap[frontendCat] = (countMap[frontendCat] || 0) + 1
            })

            setCounts(countMap)
        } catch (error) {
            console.error('Error fetching category counts:', error)
        }
    }

    return (
        <section className="categories-section-premium">
            <div className="container">
                {/* Header */}
                <div className="section-header">
                    <h2 className="section-title">Explorer par catégorie</h2>
                    <p className="section-subtitle">
                        Trouvez ce que vous cherchez dans nos catégories populaires
                    </p>
                </div>

                {/* Grid de catégories */}
                <div className="categories-grid-premium">
                    {CATEGORIES.map((category) => (
                        <CategoryCard
                            key={category.id}
                            id={category.id}
                            name={category.name}
                            icon={category.icon}
                            color={category.color}
                            gradient={category.gradient}
                            count={counts[category.id] || 0}
                            description={category.description}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
