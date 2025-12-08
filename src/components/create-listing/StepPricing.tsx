import { DollarSign, MapPin, Truck, TrendingUp } from 'lucide-react'
import './StepPricing.css'

interface Props {
    data: any
    updateData: (field: string, value: any) => void
}

export function StepPricing({ data, updateData }: Props) {
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '')
        updateData('price', value)
    }

    const formatPrice = (price: string) => {
        if (!price) return ''
        return new Intl.NumberFormat('fr-FR').format(parseInt(price))
    }

    return (
        <div className="step-pricing">
            <div className="step-header">
                <DollarSign size={32} className="step-icon" />
                <h2>Fixez votre prix</h2>
                <p>Soyez compétitif pour vendre plus vite</p>
            </div>

            {/* Prix */}
            <div className="form-group">
                <label htmlFor="price">
                    Prix de vente (FCFA) *
                </label>
                <div className="price-input-wrapper">
                    <input
                        id="price"
                        type="text"
                        value={formatPrice(data.price || '')}
                        onChange={handlePriceChange}
                        placeholder="50 000"
                        className="price-input"
                    />
                    <span className="price-currency">FCFA</span>
                </div>
                <p className="field-hint">
                    <TrendingUp size={14} />
                    Prix moyen dans cette catégorie : 45 000 - 75 000 FCFA
                </p>
            </div>

            {/* Options */}
            <div className="form-group">
                <label>Options</label>

                <div className="option-card">
                    <div className="option-content">
                        <div className="option-icon">
                            <TrendingUp size={20} />
                        </div>
                        <div className="option-text">
                            <h4>Prix négociable</h4>
                            <p>Les acheteurs pourront proposer un prix</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={data.negotiable || false}
                            onChange={(e) => updateData('negotiable', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="option-card">
                    <div className="option-content">
                        <div className="option-icon">
                            <Truck size={20} />
                        </div>
                        <div className="option-text">
                            <h4>Livraison disponible</h4>
                            <p>Vous pouvez livrer l'article</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={data.shipping_available || false}
                            onChange={(e) => updateData('shipping_available', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            {/* Localisation */}
            <div className="form-group">
                <label htmlFor="city">
                    <MapPin size={16} className="label-icon" />
                    Ville *
                </label>
                <input
                    id="city"
                    type="text"
                    value={data.city || ''}
                    onChange={(e) => updateData('city', e.target.value)}
                    placeholder="Ex: Lomé"
                />
            </div>

            <div className="form-group">
                <label htmlFor="location">
                    Quartier ou zone
                </label>
                <input
                    id="location"
                    type="text"
                    value={data.location || ''}
                    onChange={(e) => updateData('location', e.target.value)}
                    placeholder="Ex: Agoè, Bè, etc."
                />
            </div>

            {/* Téléphone de contact */}
            <div className="form-group">
                <label htmlFor="contact_phone">
                    Numéro de téléphone
                </label>
                <input
                    id="contact_phone"
                    type="tel"
                    value={data.contact_phone || ''}
                    onChange={(e) => updateData('contact_phone', e.target.value)}
                    placeholder="Ex: 90 12 34 56"
                />
                <p className="field-hint" style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                    Soyez prudent lors de vos rendez-vous.
                </p>
            </div>

            <div className="form-group">
                <div className="option-card">
                    <div className="option-content">
                        <div className="option-text">
                            <h4>Masquer mon numéro</h4>
                            <p>Les acheteurs ne verront pas votre numéro directement</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={data.hide_phone || false}
                            onChange={(e) => updateData('hide_phone', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    )
}
