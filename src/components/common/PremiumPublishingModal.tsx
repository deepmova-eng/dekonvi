import './PremiumPublishingModal.css';

export function PremiumPublishingModal() {
    return (
        <div className="premium-modal-backdrop">
            <div className="premium-modal-content">
                <div className="premium-spinner"></div>
                <h2 className="premium-modal-title">Publication en cours...</h2>
            </div>
        </div>
    );
}
