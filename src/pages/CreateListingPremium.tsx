import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../contexts/SupabaseContext'
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
    const { supabase, user } = useSupabase()
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

            // Créer l'annonce dans Supabase
            const { data: listing, error } = await supabase
                .from('listings')
                .insert({
                    user_id: user.id,
                    category: formData.category,
                    subcategory: formData.subcategory || null,
                    title: formData.title,
                    description: formData.description,
                    condition: formData.condition,
                    price: parseFloat(formData.price),
                    negotiable: formData.negotiable,
                    shipping_available: formData.shipping_available,
                    city: formData.city,
                    location: formData.location || null,
                    images: imageUrls,
                    status: 'active',
                })
                .select()
                .single()

            if (error) throw error

            // Succès : clear draft et redirection
            localStorage.removeItem('draft_listing')
            navigate(`/listings/${listing.id}`)

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
