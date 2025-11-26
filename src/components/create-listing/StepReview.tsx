import { CheckCircle, Edit2, Package, FileText, Image, DollarSign } from 'lucide-react'
import './StepReview.css'

interface Props {
    data: any
    onEdit: (step: number) => void
}

export function StepReview({ data, onEdit }: Props) {
    const getConditionLabel = () => {
        const conditions: Record<string, string> = {
            'new': 'Neuf',
            'like-new': 'Comme neuf',
            'good': 'Bon état',
            'fair': 'État correct',
            'poor': 'À rénover'
        }
        return conditions[data.condition] || data.condition
    }

    const formatPrice = (price: string) => {
        if (!price) return '0'
        return new Intl.NumberFormat('fr-FR').format(parseInt(price))
    }

    return (
        <div className="step-review">
            <div className="step-header">
                <CheckCircle size={32} className="step-icon" />
                <h2>Vérifiez votre annonce</h2>
                <p>Assurez-vous que tout est correct avant de publier</p>
            </div>

            <div className="review-sections">
                {/* Catégorie */}
                <div className="review-section">
                    <div className="review-section-header">
                        <div className="review-section-title">
                            <Package size={20} />
                            <h3>Catégorie</h3>
                        </div>
                        <button
                            className="btn-edit"
                            onClick={() => onEdit(1)}
                        >
                            <Edit2 size={16} />
                            Modifier
                        </button>
                    </div>
                    <div className="review-section-content">
                        <p className="review-value">
                            {data.category || 'Non défini'}
                            {data.subcategory && ` → ${data.subcategory}`}
                        </p>
                    </div>
                </div>

                {/* Détails */}
                <div className="review-section">
                    <div className="review-section-header">
                        <div className="review-section-title">
                            <FileText size={20} />
                            <h3>Détails</h3>
                        </div>
                        <button
                            className="btn-edit"
                            onClick={() => onEdit(2)}
                        >
                            <Edit2 size={16} />
                            Modifier
                        </button>
                    </div>
                    <div className="review-section-content">
                        <div className="review-field">
                            <span className="review-label">Titre :</span>
                            <span className="review-value">{data.title || 'Non défini'}</span>
                        </div>
                        <div className="review-field">
                            <span className="review-label">État :</span>
                            <span className="review-value">{getConditionLabel()}</span>
                        </div>
                        <div className="review-field">
                            <span className="review-label">Description :</span>
                            <p className="review-description">{data.description || 'Non définie'}</p>
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div className="review-section">
                    <div className="review-section-header">
                        <div className="review-section-title">
                            <Image size={20} />
                            <h3>Photos ({data.images?.length || 0})</h3>
                        </div>
                        <button
                            className="btn-edit"
                            onClick={() => onEdit(3)}
                        >
                            <Edit2 size={16} />
                            Modifier
                        </button>
                    </div>
                    <div className="review-section-content">
                        {data.images?.length > 0 ? (
                            <div className="review-photos-grid">
                                {data.images.map((img: any, index: number) => (
                                    <div key={img.id} className="review-photo">
                                        <img src={img.preview} alt="" />
                                        {index === 0 && <span className="main-badge">Principale</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="review-empty">Aucune photo ajoutée</p>
                        )}
                    </div>
                </div>

                {/* Prix & Livraison */}
                <div className="review-section">
                    <div className="review-section-header">
                        <div className="review-section-title">
                            <DollarSign size={20} />
                            <h3>Prix & Livraison</h3>
                        </div>
                        <button
                            className="btn-edit"
                            onClick={() => onEdit(4)}
                        >
                            <Edit2 size={16} />
                            Modifier
                        </button>
                    </div>
                    <div className="review-section-content">
                        <div className="review-price-box">
                            <span className="review-price-label">Prix</span>
                            <span className="review-price-value">
                                {formatPrice(data.price)} FCFA
                            </span>
                        </div>
                        <div className="review-tags">
                            {data.negotiable && <span className="review-tag">💰 Négociable</span>}
                            {data.shipping_available && <span className="review-tag">🚚 Livraison disponible</span>}
                        </div>
                        <div className="review-field">
                            <span className="review-label">Localisation :</span>
                            <span className="review-value">
                                {data.city || 'Non défini'}
                                {data.location && `, ${data.location}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conditions */}
            <div className="review-conditions">
                <h4>📋 Conditions de publication</h4>
                <ul>
                    <li>Vous certifiez être le propriétaire légitime de cet article</li>
                    <li>Les photos doivent représenter fidèlement l'article</li>
                    <li>Le prix affiché doit être le prix final</li>
                    <li>Vous acceptez les termes et conditions de Dekonvi</li>
                </ul>
            </div>
        </div>
    )
}
