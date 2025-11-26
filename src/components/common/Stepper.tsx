import React from 'react';
import { Check } from 'lucide-react';

interface Step {
    id: number;
    label: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="stepper-container">
            <div className="stepper-wrapper">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Étape */}
                            <div className="stepper-step">
                                {/* Cercle */}
                                <div
                                    className={`stepper-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="stepper-check" size={20} strokeWidth={3} />
                                    ) : (
                                        <span className="stepper-number">{step.id}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="stepper-label-container">
                                    <div
                                        className={`stepper-label ${isActive ? 'active' : 'inactive'
                                            }`}
                                    >
                                        {step.label}
                                    </div>
                                    {step.description && (
                                        <div className="stepper-description">{step.description}</div>
                                    )}
                                </div>
                            </div>

                            {/* Ligne de connexion */}
                            {!isLast && (
                                <div className="stepper-line-container">
                                    <div className="stepper-line-bg" />
                                    <div
                                        className={`stepper-line-fill ${isCompleted ? 'completed' : ''
                                            }`}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
