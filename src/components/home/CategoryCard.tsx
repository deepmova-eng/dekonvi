import { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import './CategoryCard.css'

interface Props {
    id: string
    name: string
    icon: LucideIcon
    color: string
    gradient: string
    count: number
    description?: string
}

export function CategoryCard({ id, name, icon: Icon, color, gradient, count, description }: Props) {
    return (
        <Link
            to={`/category/${id}`}
            className="category-card-premium"
            style={{
                '--category-color': color,
                '--category-gradient': gradient
            } as any}
        >
            {/* Fond avec gradient animé */}
            <div className="card-background" />

            {/* Contenu */}
            <div className="card-content">

                {/* Icône */}
                <div className="card-icon-wrapper">
                    <div className="card-icon">
                        <Icon size={32} strokeWidth={2} />
                    </div>
                </div>

                {/* Texte */}
                <div className="card-text">
                    <h3 className="card-title">{name}</h3>
                    {description && (
                        <p className="card-description">{description}</p>
                    )}
                    <div className="card-meta">
                        <span className="card-count">{count.toLocaleString()} annonces</span>
                        <span className="card-arrow">→</span>
                    </div>
                </div>
            </div>

            {/* Badge premium (optionnel) */}
            {count > 100 && (
                <div className="card-badge">🔥 Populaire</div>
            )}

            {/* Effet de brillance au hover */}
            <div className="card-shine" />
        </Link>
    )
}
