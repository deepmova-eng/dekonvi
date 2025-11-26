import { MapPin, Package, Eye } from 'lucide-react'
import './PreviewPane.css'

interface Props {
    data: any
}

export function PreviewPane({ data }: Props) {
    const formatPrice = (price: string) => {
        if (!price) return '0'
        return new Intl.NumberFormat('fr-FR').format(parseInt(price))
    }

    const getConditionLabel = () => {
        const conditions: Record<string, string> = {
            'new': 'Neuf',
            'like-new': 'Comme neuf',
            'good': 'Bon état',
            'fair': 'État correct',
            'poor': 'À rénover'
        }
        return conditions[data.condition] || 'Non défini'
    }

    return (
        <div className="preview-pane">


            {/* Preview Card */}
            <div className="preview-card">
                {/* Image */}
                <div className="preview-image">
                    {data.images?.length > 0 ? (
                        <img src={data.images[0].preview} alt="Preview" />
                    ) : (
                        <div className="preview-image-placeholder">
                            <Package size={48} />
                            <span>Aucune photo</span>
                        </div>
                    )}
                    {data.images?.length > 1 && (
                        <div className="preview-image-count">
                            +{data.images.length - 1}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="preview-content">
                    <h4 className="preview-title">
                        {data.title || 'Titre de votre annonce'}
                    </h4>

                    <div className="preview-price">
                        {formatPrice(data.price)} FCFA
                        {data.negotiable && <span className="preview-badge">Négociable</span>}
                    </div>

                    <div className="preview-meta">
                        {data.city && (
                            <span className="preview-meta-item">
                                <MapPin size={14} />
                                {data.city}
                            </span>
                        )}
                        <span className="preview-meta-item">
                            {getConditionLabel()}
                        </span>
                    </div>

                    {data.description && (
                        <p className="preview-description">
                            {data.description.slice(0, 100)}
                            {data.description.length > 100 && '...'}
                        </p>
                    )}

                    {data.shipping_available && (
                        <div className="preview-shipping">
                            🚚 Livraison disponible
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="preview-stats">
                <div className="preview-stat">
                    <Eye size={16} />
                    <span>Aperçu en temps réel</span>
                </div>
            </div>
        </div>
    )
}
