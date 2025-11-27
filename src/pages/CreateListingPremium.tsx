import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../contexts/SupabaseContext'
import { supabase } from '../lib/supabase'
import {
    Package,
    FileText,
    Image as ImageIcon,
    DollarSign,
    CheckCircle,
    ArrowRight,
    ArrowLeft
} from 'lucide-react'
import { StepIndicator } from '../components/create-listing/StepIndicator'
import { StepCategory } from '../components/create-listing/StepCategory'
import { StepDetails } from '../components/create-listing/StepDetails'
import { StepPhotos } from '../components/create-listing/StepPhotos'
import { StepPricing } from '../components/create-listing/StepPricing'
import { StepReview } from '../components/create-listing/StepReview'
import './CreateListingPremium.css'

const STEPS = [
    { id: 1, name: 'Catégorie', icon: Package },
    { id: 2, name: 'Détails', icon: FileText },
    { id: 3, name: 'Photos', icon: ImageIcon },
    { id: 4, name: 'Prix', icon: DollarSign },
    { id: 5, name: 'Review', icon: CheckCircle },
]

export default function CreateListingPremium() {
    const navigate = useNavigate()
    const { user } = useSupabase()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        title: '',
        description: '',
        condition: 'new',
        images: [],
        price: '',
        negotiable: false,
        shipping_available: false,
        city: '',
        location: '',
    })

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Auto-save to localStorage
        localStorage.setItem('draft_listing', JSON.stringify({ ...formData, [field]: value }))
    }

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Mapping des valeurs du formulaire vers les valeurs de la base de données
    const mapCategoryToDb = (category: string): string => {
        const mapping: Record<string, string> = {
            // StepCategory IDs → Database values
            'electronics': 'high-tech',
            'fashion': 'mode',
            'home': 'maison',
            'vehicles': 'vehicules',
            'books': 'loisirs',
            'other': 'autres',
            // Fallback for config/categories.ts values
            'multimedia': 'high-tech',
            'emploi': 'emploi-services',
            'professionnel': 'materiel-pro',
        }
        const mapped = mapping[category] || category
        console.log(`Category mapping: ${category} → ${mapped}`)
        return mapped
    }

    const mapConditionToDb = (condition: string): string => {
        const mapping: Record<string, string> = {
            'new': 'neuf',
            'like-new': 'comme-neuf',
            'good': 'bon-etat',
            'fair': 'etat-correct',
            'poor': 'a-renover',
        }
        return mapping[condition] || condition
    }

    const handleSubmit = async () => {
        try {
            setIsLoading(true)

            // Vérifier authentification
            if (!user) {
                alert('Vous devez être connecté pour publier une annonce')
                navigate('/login')
                return
            }

            // Validation basique
            if (!formData.category || !formData.title || !formData.price) {
                alert('Veuillez remplir tous les champs obligatoires')
                return
            }

            // Préparer les URLs d'images (temporaire pour Phase 1)
            const imageUrls = formData.images.map((img: any) => img.preview)

            // Combiner city et location en un seul champ location
            const locationString = formData.city + (formData.location ? `, ${formData.location}` : '')

            // Map category and condition
            const dbCategory = mapCategoryToDb(formData.category)
            const dbCondition = mapConditionToDb(formData.condition)

            // DEBUG: Log valeurs avant insertion
            console.log('=== DEBUG INSERTION ===')
            console.log('Form category:', formData.category, '→ DB:', dbCategory)
            console.log('Form condition:', formData.condition, '→ DB:', dbCondition)
            console.log('Location:', locationString)
            console.log('======================')

            // Créer l'annonce dans Supabase
            // NOTE: Seuls les champs existants dans le schéma sont utilisés
            const { data: listing, error } = await supabase
                .from('listings')
                .insert({
                    seller_id: user.id,
                    category: dbCategory,
                    // subcategory n'existe pas dans la table
                    title: formData.title,
                    description: formData.description,
                    condition: dbCondition as any, // Values in French
                    price: parseFloat(formData.price),
                    // negotiable n'existe pas dans la table
                    delivery_available: formData.shipping_available,
                    location: locationString,
                    images: imageUrls,
                    status: 'active',
                    is_premium: false,
                    hide_phone: false,
                })
                .select()
                .single()

            if (error) throw error

            // Succès : clear draft et redirection
            localStorage.removeItem('draft_listing')
            navigate(`/ listings / ${listing.id} `)

        } catch (error: any) {
            console.error('Error creating listing:', error)
            alert(`Erreur lors de la création de l'annonce: ${error.message || 'Erreur inconnue'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="create-listing-page">

            {/* Simple back button */}
            <div className="simple-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Retour
                </button>
            </div>

            <div className="create-listing-body">
                <div className="container-centered">
                    <div className="form-card">

                        {/* Step Indicator */}
                        <div className="step-indicator-wrapper">
                            <StepIndicator
                                steps={STEPS}
                                currentStep={currentStep}
                            />
                        </div>

                        {/* Step content */}
                        {currentStep === 1 && (
                            <StepCategory
                                data={formData}
                                updateData={updateFormData}
                            />
                        )}

                        {currentStep === 2 && (
                            <StepDetails
                                data={formData}
                                updateData={updateFormData}
                            />
                        )}

                        {currentStep === 3 && (
                            <StepPhotos
                                data={formData}
                                updateData={updateFormData}
                            />
                        )}

                        {currentStep === 4 && (
                            <StepPricing
                                data={formData}
                                updateData={updateFormData}
                            />
                        )}

                        {currentStep === 5 && (
                            <StepReview
                                data={formData}
                                onEdit={(step) => setCurrentStep(step)}
                            />
                        )}

                        {/* Navigation buttons */}
                        <div className="form-navigation">
                            {currentStep > 1 && (
                                <button
                                    className="btn-secondary btn-large"
                                    onClick={prevStep}
                                >
                                    <ArrowLeft size={20} />
                                    Précédent
                                </button>
                            )}

                            {currentStep < STEPS.length ? (
                                <button
                                    className="btn-primary btn-large"
                                    onClick={nextStep}
                                >
                                    Suivant
                                    <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button
                                    className="btn-primary btn-large"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span>Publication...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Publier l'annonce
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Auto-save indicator */}
                    <div className="auto-save-indicator">
                        ✓ Brouillon sauvegardé automatiquement
                    </div>
                </div>
            </div>
        </div>
    )
}
