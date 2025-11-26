import { Check } from 'lucide-react'
import './StepIndicator.css'

interface Step {
    id: number
    name: string
    icon: any
}

interface Props {
    steps: Step[]
    currentStep: number
}

export function StepIndicator({ steps, currentStep }: Props) {
    return (
        <div className="step-indicator">
            {steps.map((step, index) => {
                const isCompleted = step.id < currentStep
                const isCurrent = step.id === currentStep
                const Icon = step.icon

                return (
                    <div key={step.id} className="step-indicator-item">
                        {/* Step circle */}
                        <div className={`step-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isCompleted ? (
                                <Check size={16} strokeWidth={3} />
                            ) : (
                                <Icon size={16} />
                            )}
                        </div>

                        {/* Step label (desktop only) */}
                        <span className="step-label">{step.name}</span>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
