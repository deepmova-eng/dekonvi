import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { uploadImages } from '../utils/uploadImages'
import { PremiumPublishingModal } from '../components/common/PremiumPublishingModal'
import './CreateListingPremium.css'
import toast from 'react-hot-toast'

const STEPS = [
    { id: 1, name: 'Catégorie', icon: Package },
    { id: 2, name: 'Détails', icon: FileText },
    { id: 3, name: 'Photos', icon: ImageIcon },
    { id: 4, name: 'Prix', icon: DollarSign },
    { id: 5, name: 'Review', icon: CheckCircle },
]

export default function CreateListingPremium() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useSupabase()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Check if editing existing listing
    const editingListing = location.state?.listing
    const isEditing = !!editingListing

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
        contact_phone: '',
        hide_phone: false,
        dynamic_fields: {},
    })

    //  Load editing data when in edit mode
    useEffect(() => {
        if (isEditing && editingListing) {
            // Map database condition back to form values
            const conditionMapping: Record<string, string> = {
                'neuf': 'new',
                'comme-neuf': 'like-new',
                'bon-etat': 'good',
                'etat-correct': 'fair',
                'a-renover': 'poor',
            }

            // Reverse map database category to form category ID
            const categoryReverseMapping: Record<string, string> = {
                'high-tech': 'electronics',
                'mode': 'fashion',
                'maison': 'home',
                'vehicules': 'vehicles',
                'loisirs': 'books',
                'autres': 'other',
            }

            //Parse location field (format: "City, Location")
            const [city, ...locationParts] = (editingListing.location || '').split(',')

            // Transform existing image URLs to objects with preview for StepPhotos
            const existingImagesAsObjects = (editingListing.images || [])
                .filter((url: string) => url && typeof url === 'string') // Filter out invalid URLs
                .map((url: string, index: number) => ({
                    id: `existing-${index}-${Date.now()}`, // Unique ID
                    preview: url,
                    file: null,  // No file object for existing URLs
                    isExisting: true
                }))

            console.log('🖼️ Images chargées:', existingImagesAsObjects)

            setFormData({
                category: categoryReverseMapping[editingListing.category] || editingListing.category || '',
                subcategory: editingListing.subcategory || '',
                title: editingListing.title || '',
                description: editingListing.description || '',
                condition: conditionMapping[editingListing.condition] || 'new',
                images: existingImagesAsObjects,
                price: editingListing.price?.toString() || '',
                negotiable: false,
                shipping_available: editingListing.delivery_available || false,
                city: city?.trim() || '',
                location: locationParts.join(',').trim() || '',
                contact_phone: editingListing.contact_phone || '',
                hide_phone: editingListing.hide_phone || false,
                dynamic_fields: editingListing.dynamic_fields || {},
            })

            console.log('✅ Données chargées pour édition:', {
                category: categoryReverseMapping[editingListing.category],
                subcategory: editingListing.subcategory,
                imagesCount: existingImagesAsObjects.length,
                originalListing: editingListing
            })
        }
    }, [isEditing, editingListing])

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Auto-save to localStorage (skip in edit mode)
        if (!isEditing) {
            localStorage.setItem('draft_listing', JSON.stringify({ ...formData, [field]: value }))
        }
    }


    const validateStep = (): { valid: boolean; message?: string } => {
        switch (currentStep) {
            case 1: // Catégorie
                if (!formData.category) {
                    return { valid: false, message: '📋 Veuillez sélectionner une catégorie' }
                }
                if (!formData.subcategory) {
                    return { valid: false, message: '📋 Veuillez sélectionner une sous-catégorie' }
                }
                return { valid: true }

            case 2: // Détails
                if (!formData.title || formData.title.length < 10) {
                    return { valid: false, message: '✏️ Le titre doit contenir au moins 10 caractères' }
                }
                if (!formData.description || formData.description.length < 20) {
                    return { valid: false, message: '📝 La description doit contenir au moins 20 caractères pour être publiée' }
                }
                if (!formData.condition) {
                    return { valid: false, message: '🏷️ Veuillez sélectionner l\'état du produit' }
                }
                return { valid: true }

            case 3: // Photos
                if (formData.images.length === 0) {
                    return { valid: false, message: '📸 Ajoutez au moins une photo de votre article' }
                }
                return { valid: true }

            case 4: // Prix
                if (!formData.price || parseFloat(formData.price) <= 0) {
                    return { valid: false, message: '💰 Veuillez indiquer un prix valide' }
                }
                if (!formData.city || formData.city.trim().length === 0) {
                    return { valid: false, message: '📍 Veuillez indiquer votre ville' }
                }
                return { valid: true }

            default:
                return { valid: true }
        }
    }

    const nextStep = () => {
        // Valider avant de passer à l'étape suivante
        const validation = validateStep()

        if (!validation.valid) {
            alert(validation.message)
            return
        }

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

            // Separate existing URLs from new File objects
            // Images can be: {file: File, preview: string} OR {isExisting: true, preview: URL string}
            const existingImageUrls = formData.images
                .filter((img: any) => img.isExisting === true)
                .map((img: any) => img.preview) // Extract URL from preview

            const newImageObjects = formData.images
                .filter((img: any) => img.file !== null && img.file !== undefined) // Keep complete objects

            // Upload only new images to Supabase Storage
            let newImageUrls: string[] = []
            if (newImageObjects.length > 0) {
                console.log('📤 Upload de', newImageObjects.length, 'nouvelles images vers Supabase...')
                newImageUrls = await uploadImages(newImageObjects, user.id)
                console.log('✅ Nouvelles images uploadées:', newImageUrls)
            }

            // Combine existing and new image URLs
            const finalImageUrls = [...existingImageUrls, ...newImageUrls]

            // Combiner city et location en un seul champ location
            const locationString = formData.city + (formData.location ? `, ${formData.location}` : '')

            // Map category and condition
            const dbCategory = mapCategoryToDb(formData.category)
            const dbCondition = mapConditionToDb(formData.condition)

            // Prepare listing data
            const listingData = {
                category: dbCategory,
                subcategory: formData.subcategory || '', // Save subcategory (empty string if not set)
                title: formData.title,
                description: formData.description,
                condition: dbCondition as any,
                price: parseFloat(formData.price),
                delivery_available: formData.shipping_available,
                location: locationString,
                images: finalImageUrls,
                contact_phone: formData.contact_phone || '',
                hide_phone: formData.hide_phone || false,
                dynamic_fields: formData.dynamic_fields || {},
            }

            if (isEditing) {
                // UPDATE existing listing
                const { data: listing, error } = await supabase
                    .from('listings')
                    .update(listingData)
                    .eq('id', editingListing.id)
                    .select()
                    .single()

                if (error) throw error

                // User feedback about re-moderation
                toast('⏳ Vos modifications ont été envoyées pour validation.', {
                    duration: 6000,
                    style: {
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: '500',
                    },
                })
                toast.success('Votre annonce sera bientôt visible après validation par un administrateur.')

                // Redirect to listing details (with replace to avoid back button loop)
                navigate(`/listings/${listing.id}`, { replace: true })
            } else {
                // CREATE new listing
                const { data: listing, error } = await supabase
                    .from('listings')
                    .insert({
                        seller_id: user.id,
                        ...listingData,
                        status: 'active',
                        is_premium: false,
                    })
                    .select()
                    .single()

                if (error) throw error

                // Success : clear draft et redirection (with replace to avoid back button loop)
                localStorage.removeItem('draft_listing')
                navigate(`/listings/${listing.id}`, { replace: true })
            }

        } catch (error: any) {
            console.error('Error:', error)
            alert(`Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} de l'annonce: ${error.message || 'Erreur inconnue'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="create-listing-page" >

            {/* Simple back button */}
            < div className="simple-header" >
                <button className="back-button" onClick={() => navigate('/', { replace: true })}>
                    <ArrowLeft size={20} />
                    {isEditing ? 'Annuler les modifications' : 'Retour'}
                </button>
            </div>

            <div className="create-listing-body">
                <div className="container-centered">
                    <div className="form-card">

                        {/* Page Title */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                {isEditing ? 'Modifier l\'annonce' : 'Créer une annonce'}
                            </h1>
                        </div>

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
                                            <span>{isEditing ? 'Mise à jour...' : 'Publication...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            {isEditing ? 'Mettre à jour' : 'Publier l\'annonce'}
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

            {/* Premium Publishing Modal */}
            {isLoading && <PremiumPublishingModal />}
        </div >
    )
}
