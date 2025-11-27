export interface DynamicField {
    name: string
    label: string
    type: 'text' | 'number' | 'select' | 'radio'
    placeholder?: string
    options?: string[]
    required?: boolean
    unit?: string
}

export const DYNAMIC_FIELDS: Record<string, DynamicField[]> = {
    // Électronique
    electronics: [
        {
            name: 'brand',
            label: 'Marque',
            type: 'text',
            placeholder: 'Apple, Samsung, Xiaomi...',
            required: true
        },
        {
            name: 'model',
            label: 'Modèle',
            type: 'text',
            placeholder: 'iPhone 13 Pro, Galaxy S23...',
            required: true
        },
        {
            name: 'storage',
            label: 'Capacité de stockage',
            type: 'select',
            options: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
        },
        {
            name: 'color',
            label: 'Couleur',
            type: 'text',
            placeholder: 'Noir, Blanc, Bleu...',
        },
        {
            name: 'warranty',
            label: 'Garantie restante',
            type: 'select',
            options: ['Aucune', '3 mois', '6 mois', '1 an', '2 ans'],
        },
    ],

    // Véhicules
    vehicles: [
        {
            name: 'make',
            label: 'Marque',
            type: 'text',
            placeholder: 'Toyota, Mercedes, Honda...',
            required: true
        },
        {
            name: 'model',
            label: 'Modèle',
            type: 'text',
            placeholder: 'Corolla, C-Class, Civic...',
            required: true
        },
        {
            name: 'year',
            label: 'Année',
            type: 'number',
            placeholder: '2020',
            required: true
        },
        {
            name: 'mileage',
            label: 'Kilométrage',
            type: 'number',
            placeholder: '50000',
            unit: 'km'
        },
        {
            name: 'fuel_type',
            label: 'Carburant',
            type: 'select',
            options: ['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL'],
            required: true
        },
        {
            name: 'transmission',
            label: 'Transmission',
            type: 'radio',
            options: ['Manuelle', 'Automatique'],
            required: true
        },
    ],

    // Immobilier (si jamais dans "other")
    real_estate: [
        {
            name: 'surface',
            label: 'Surface',
            type: 'number',
            placeholder: '100',
            unit: 'm²',
            required: true
        },
        {
            name: 'rooms',
            label: 'Nombre de pièces',
            type: 'number',
            placeholder: '3',
            required: true
        },
        {
            name: 'bedrooms',
            label: 'Chambres',
            type: 'number',
            placeholder: '2',
        },
        {
            name: 'bathrooms',
            label: 'Salles de bain',
            type: 'number',
            placeholder: '1',
        },
        {
            name: 'floor',
            label: 'Étage',
            type: 'number',
            placeholder: '3',
        },
    ],

    // Mode
    fashion: [
        {
            name: 'brand',
            label: 'Marque',
            type: 'text',
            placeholder: 'Nike, Adidas, Zara...',
        },
        {
            name: 'size',
            label: 'Taille',
            type: 'select',
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46'],
            required: true
        },
        {
            name: 'color',
            label: 'Couleur',
            type: 'text',
            placeholder: 'Noir, Blanc, Rouge...',
        },
        {
            name: 'gender',
            label: 'Genre',
            type: 'radio',
            options: ['Homme', 'Femme', 'Unisexe', 'Enfant'],
            required: true
        },
    ],

    // Maison
    home: [
        {
            name: 'brand',
            label: 'Marque',
            type: 'text',
            placeholder: 'IKEA, Conforama...',
        },
        {
            name: 'material',
            label: 'Matériau',
            type: 'text',
            placeholder: 'Bois, Métal, Plastique...',
        },
        {
            name: 'dimensions',
            label: 'Dimensions',
            type: 'text',
            placeholder: 'L x l x H (cm)',
        },
        {
            name: 'color',
            label: 'Couleur',
            type: 'text',
            placeholder: 'Blanc, Noir, Bois...',
        },
    ],

    // Livres & Loisirs
    books: [
        {
            name: 'author',
            label: 'Auteur',
            type: 'text',
            placeholder: 'Nom de l\'auteur',
        },
        {
            name: 'language',
            label: 'Langue',
            type: 'select',
            options: ['Français', 'Anglais', 'Espagnol', 'Autre'],
            required: true
        },
        {
            name: 'year',
            label: 'Année de publication',
            type: 'number',
            placeholder: '2020',
        },
        {
            name: 'pages',
            label: 'Nombre de pages',
            type: 'number',
            placeholder: '300',
        },
    ],

    // Autre (champs génériques)
    other: [
        {
            name: 'brand',
            label: 'Marque / Fabricant',
            type: 'text',
            placeholder: 'Si applicable',
        },
        {
            name: 'material',
            label: 'Matériau',
            type: 'text',
            placeholder: 'Si applicable',
        },
    ],
}
