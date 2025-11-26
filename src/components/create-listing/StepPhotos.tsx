import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'
import './StepPhotos.css'

interface Props {
    data: any
    updateData: (field: string, value: any) => void
}

export function StepPhotos({ data, updateData }: Props) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            handleFiles(files)
        }
    }

    const handleFiles = (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'))

        const newImages = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36),
        }))

        updateData('images', [...data.images, ...newImages])
    }

    const removeImage = (id: string) => {
        updateData('images', data.images.filter((img: any) => img.id !== id))
    }

    const setMainImage = (id: string) => {
        const images = [...data.images]
        const index = images.findIndex((img: any) => img.id === id)
        if (index > 0) {
            const [mainImage] = images.splice(index, 1)
            images.unshift(mainImage)
            updateData('images', images)
        }
    }

    return (
        <div className="step-photos">
            <div className="step-header">
                <ImageIcon size={32} className="step-icon" />
                <h2>Ajoutez des photos de qualité</h2>
                <p>Les annonces avec photos obtiennent 5x plus de vues</p>
            </div>

            {/* Upload zone */}
            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload size={48} className="upload-icon" />
                <h3>Glissez vos photos ici</h3>
                <p>ou cliquez pour parcourir</p>
                <span className="upload-hint">PNG, JPG jusqu'à 10MB • Max 8 photos</span>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Preview grid */}
            {data.images.length > 0 && (
                <div className="photos-grid">
                    {data.images.map((image: any, index: number) => (
                        <div
                            key={image.id}
                            className={`photo-preview ${index === 0 ? 'main' : ''}`}
                        >
                            <img src={image.preview} alt="" />

                            {index === 0 && (
                                <div className="main-badge">Photo principale</div>
                            )}

                            <div className="photo-actions">
                                {index > 0 && (
                                    <button
                                        className="photo-action"
                                        onClick={() => setMainImage(image.id)}
                                        title="Définir comme principale"
                                    >
                                        ⭐
                                    </button>
                                )}
                                <button
                                    className="photo-action delete"
                                    onClick={() => removeImage(image.id)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {data.images.length < 8 && (
                        <button
                            className="photo-add"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Plus size={32} />
                            <span>Ajouter</span>
                        </button>
                    )}
                </div>
            )}

            {/* Tips */}
            <div className="photo-tips">
                <h4>💡 Conseils pour de belles photos</h4>
                <ul>
                    <li>Utilisez un bon éclairage naturel</li>
                    <li>Montrez l'objet sous plusieurs angles</li>
                    <li>Incluez les détails importants</li>
                    <li>Évitez les fonds encombrés</li>
                </ul>
            </div>
        </div>
    )
}
