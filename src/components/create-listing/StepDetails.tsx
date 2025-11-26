import { FileText, AlertCircle } from 'lucide-react'
import './StepDetails.css'

interface Props {
    data: any
    updateData: (field: string, value: any) => void
}

const CONDITIONS = [
    { value: 'new', label: 'Neuf', description: 'Jamais utilisé, dans son emballage' },
    { value: 'like-new', label: 'Comme neuf', description: 'Utilisé une ou deux fois, état parfait' },
    { value: 'good', label: 'Bon état', description: 'Signes d\'utilisation minimes' },
    { value: 'fair', label: 'État correct', description: 'Quelques marques d\'usure' },
    { value: 'poor', label: 'À rénover', description: 'Usure importante ou pièces à changer' },
]

export function StepDetails({ data, updateData }: Props) {
    const titleLength = data.title?.length || 0
    const descLength = data.description?.length || 0

    return (
        <div className="step-details">
            <div className="step-header">
                <FileText size={32} className="step-icon" />
                <h2>Décrivez votre article</h2>
                <p>Soyez précis pour attirer plus d'acheteurs</p>
            </div>

            {/* Titre */}
            <div className="form-group">
                <label htmlFor="title">
                    Titre de l'annonce *
                    <span className="char-counter">{titleLength}/80</span>
                </label>
                <input
                    id="title"
                    type="text"
                    value={data.title || ''}
                    onChange={(e) => updateData('title', e.target.value)}
                    placeholder="Ex: iPhone 13 Pro 256Go Bleu Alpine - Comme neuf"
                    maxLength={80}
                    className={titleLength < 10 ? 'warning' : ''}
                />
                {titleLength < 10 && titleLength > 0 && (
                    <p className="field-hint warning">
                        <AlertCircle size={14} />
                        Le titre doit contenir au moins 10 caractères
                    </p>
                )}
            </div>

            {/* État */}
            <div className="form-group">
                <label>État du produit *</label>
                <div className="condition-grid">
                    {CONDITIONS.map((condition) => {
                        const isSelected = data.condition === condition.value

                        return (
                            <button
                                key={condition.value}
                                type="button"
                                className={`condition-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => updateData('condition', condition.value)}
                            >
                                <div className="condition-header">
                                    <span className="condition-label">{condition.label}</span>
                                    {isSelected && (
                                        <div className="condition-check">✓</div>
                                    )}
                                </div>
                                <p className="condition-desc">{condition.description}</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Description */}
            <div className="form-group">
                <label htmlFor="description">
                    Description détaillée *
                    <span className="char-counter">{descLength}/1000</span>
                </label>
                <textarea
                    id="description"
                    value={data.description || ''}
                    onChange={(e) => updateData('description', e.target.value)}
                    placeholder="Décrivez votre article en détail : caractéristiques, défauts éventuels, raison de la vente..."
                    rows={8}
                    maxLength={1000}
                    className={descLength < 50 ? 'warning' : ''}
                />
                {descLength < 50 && descLength > 0 && (
                    <p className="field-hint warning">
                        <AlertCircle size={14} />
                        La description doit contenir au moins 50 caractères
                    </p>
                )}
                <p className="field-hint">
                    💡 Une description complète augmente vos chances de vente de 60%
                </p>
            </div>
        </div>
    )
}
