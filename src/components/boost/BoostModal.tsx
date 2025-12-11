import { useState, useEffect } from 'react';
import { X, Zap, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Define types locally since they might not be in Database yet
type BoostPackage = {
    id: string;
    name: string;
    duration_days: number;
    price: number;
    description: string;
    active: boolean;
    created_at: string;
};

interface BoostModalProps {
    isOpen: boolean;
    listingId: string;
    onClose: () => void;
    tickerOnly?: boolean; // If true, show only Ticker Star package
}

type PaymentStep = 'selection' | 'payment' | 'processing' | 'success' | 'error';

export default function BoostModal({ isOpen, listingId, onClose, tickerOnly = false }: BoostModalProps) {
    const [packages, setPackages] = useState<BoostPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<BoostPackage | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [step, setStep] = useState<PaymentStep>('selection');
    const [countdown, setCountdown] = useState(120); // 120 seconds
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [loadingPackages, setLoadingPackages] = useState(true); // Prevent flash

    // Fetch packages on mount
    useEffect(() => {
        if (isOpen) {
            fetchPackages();
            resetModal();
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (step === 'processing' && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        } else if (countdown === 0 && step === 'processing' && transactionId) {
            // Countdown expired - check PayGate API as fallback
            checkPaymentStatusFallback();
        }
    }, [step, countdown, transactionId]);

    // Poll PayGate API status while processing (every 10 seconds)
    useEffect(() => {
        if (step === 'processing' && transactionId) {
            // First check immediately after 5 seconds (give time for PayGate to process)
            const initialCheck = setTimeout(() => {
                checkPaymentStatusFallback();
            }, 5000);

            // Then check every 10 seconds
            const pollInterval = setInterval(() => {
                checkPaymentStatusFallback();
            }, 10000); // Every 10 seconds

            return () => {
                clearTimeout(initialCheck);
                clearInterval(pollInterval);
            };
        }
    }, [step, transactionId]);

    const fetchPackages = async () => {
        setLoadingPackages(true); // Start loading

        // Build query - filter at database level to avoid flash
        let query = supabase
            .from('boost_packages')
            .select('*')
            .eq('active', true);

        // If tickerOnly, filter for Ticker Star at query level (no flash!)
        if (tickerOnly) {
            query = query.eq('name', 'Ticker Star');
        }

        const { data, error } = await query.order('price');

        if (error) {
            console.error('Error fetching packages:', error);
            toast.error('Erreur lors du chargement des offres');
            setLoadingPackages(false);
            return;
        }

        setPackages(data || []);
        setLoadingPackages(false); // Done loading
    };

    const resetModal = () => {
        setStep('selection');
        setSelectedPackage(null);
        setPhoneNumber('');
        setCountdown(120);
        setTransactionId(null);
        setErrorMessage('');
    };

    const handleNetworkSelect = async (network: 'tmoney' | 'flooz') => {
        if (!selectedPackage) return;

        // Validate phone number (Togo format)
        const phoneRegex = /^(90|91|92|93|96|97|98|99)\d{6}$/;
        if (!phoneRegex.test(phoneNumber)) {
            toast.error('Numéro invalide. Format : 90XXXXXX');
            return;
        }

        setStep('processing');
        setCountdown(120);

        try {
            const { data, error } = await supabase.functions.invoke('initiate-payment', {
                body: {
                    listing_id: listingId,
                    package_id: selectedPackage.id,
                    phone_number: phoneNumber,
                    network,
                },
            });

            if (error || !data.success) {
                throw new Error(data?.error || 'Erreur lors de l\'initialisation du paiement');
            }

            setTransactionId(data.transaction_id);
            toast.success('Paiement initié ! Validez sur votre téléphone.');
        } catch (error: any) {
            console.error('Payment error:', error);
            setStep('error');
            setErrorMessage(error.message || 'Une erreur est survenue');
            toast.error(error.message || 'Erreur lors du paiement');
        }
    };

    const checkPaymentStatusFallback = async () => {
        if (!transactionId) return;

        console.log('🔍 Checking payment status with PayGate...', transactionId);

        try {
            const { data, error } = await supabase.functions.invoke('check-payment-status', {
                body: { transaction_id: transactionId },
            });

            if (error) {
                console.error('Payment check error:', error);
                // Don't show error during active polling, only log it
                if (countdown === 0) {
                    setStep('error');
                    setErrorMessage('Impossible de vérifier le paiement. Contactez le support.');
                }
                return;
            }

            console.log('✅ Payment status from PayGate:', data.status);

            if (data.status === 'success') {
                setStep('success');
                toast.success('Paiement confirmé ! Votre annonce est maintenant boostée.');
            } else if (data.status === 'expired') {
                setStep('error');
                setErrorMessage('Délai de paiement expiré. Veuillez réessayer.');
            } else if (data.status === 'cancelled') {
                setStep('error');
                setErrorMessage('Paiement annulé.');
            } else if (data.status === 'pending') {
                // Still pending - continue polling, don't show error
                console.log('⏳ Payment still pending on PayGate, will check again...');

                // Only show error if countdown expired
                if (countdown === 0) {
                    setStep('error');
                    setErrorMessage('Délai expiré. Si vous avez payé, votre boost sera activé sous peu.');
                }
            }
        } catch (err) {
            console.error('Error checking payment status:', err);
            // Only show error if countdown expired
            if (countdown === 0) {
                setStep('error');
                setErrorMessage('Erreur lors de la vérification. Veuillez rafraîchir la page.');
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return ((120 - countdown) / 120) * 100;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Booster mon annonce</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Package Selection */}
                    {step === 'selection' && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Choisissez une offre pour mettre votre annonce en vedette
                            </p>

                            {loadingPackages ? (
                                <div className="flex justify-center py-8">
                                    <Loader className="w-8 h-8 animate-spin text-primary-500" />
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {packages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => {
                                                setSelectedPackage(pkg);
                                                setStep('payment');
                                            }}
                                            className={`relative p-4 border-2 rounded-xl text-left transition-all hover:border-primary-500 hover:shadow-lg ${selectedPackage?.id === pkg.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary-600">
                                                        {pkg.price} FCFA
                                                    </div>
                                                    <div className="text-sm text-gray-500">{pkg.duration_days} jour{pkg.duration_days > 1 ? 's' : ''}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Payment Details */}
                    {step === 'payment' && selectedPackage && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setStep('selection')}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                ← Retour
                            </button>

                            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-gray-600">Offre sélectionnée</div>
                                        <div className="font-bold text-lg">{selectedPackage.name}</div>
                                    </div>
                                    <div className="text-2xl font-bold text-primary-600">
                                        {selectedPackage.price} FCFA
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numéro de téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\s/g, ''))}
                                    placeholder="90XXXXXX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    maxLength={8}
                                />
                                <p className="text-xs text-gray-500 mt-1">Format : 90XXXXXX, 91XXXXXX, etc.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleNetworkSelect('tmoney')}
                                    disabled={phoneNumber.length !== 8}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>TMoney</span>
                                </button>

                                <button
                                    onClick={() => handleNetworkSelect('flooz')}
                                    disabled={phoneNumber.length !== 8}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Flooz</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing with Countdown */}
                    {step === 'processing' && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full">
                                <Loader className="w-10 h-10 text-primary-600 animate-spin" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-2">Validation en cours...</h3>
                                <p className="text-gray-600">
                                    Composez <span className="font-mono font-bold">*890*1*9#</span> sur votre téléphone
                                    <br />
                                    pour valider le paiement
                                </p>
                            </div>

                            {/* Countdown Timer */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary-600">
                                    <Clock className="w-6 h-6" />
                                    {formatTime(countdown)}
                                </div>

                                {/* Progress Bar */}
                                <div className="max-w-xs mx-auto">
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-1000"
                                            style={{ width: `${getProgressPercentage()}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {120 - countdown}/120 secondes
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Succès !</h3>
                                <p className="text-gray-600">
                                    Votre annonce est maintenant en vedette !
                                    <br />
                                    Elle apparaîtra en haut de la page d'accueil.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition"
                            >
                                Voir mon annonce
                            </button>
                        </div>
                    )}

                    {/* Step 5: Error */}
                    {step === 'error' && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                                <AlertCircle className="w-12 h-12 text-red-600" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-red-600 mb-2">
                                    {countdown === 0 ? 'Délai expiré' : 'Erreur'}
                                </h3>
                                <p className="text-gray-600">{errorMessage}</p>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetModal}
                                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition"
                                >
                                    Réessayer
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
