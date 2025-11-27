import { DynamicField } from '../../config/dynamicFields'
import './DynamicFields.css'

interface Props {
    fields: DynamicField[]
    values: Record<string, any>
    onChange: (name: string, value: any) => void
}

export function DynamicFields({ fields, values, onChange }: Props) {
    if (fields.length === 0) return null

    return (
        <div className="dynamic-fields">
            <div className="dynamic-fields-header">
                <h4>Informations spécifiques</h4>
                <p>Complétez ces détails pour une annonce plus précise</p>
            </div>

            <div className="dynamic-fields-grid">
                {fields.map((field) => (
                    <div key={field.name} className="dynamic-field">
                        <label className="field-label">
                            {field.label}
                            {field.required && <span className="required">*</span>}
                        </label>

                        {field.type === 'text' && (
                            <input
                                type="text"
                                className="field-input"
                                placeholder={field.placeholder}
                                value={values[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'number' && (
                            <div className="field-with-unit">
                                <input
                                    type="number"
                                    className="field-input"
                                    placeholder={field.placeholder}
                                    value={values[field.name] || ''}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                    required={field.required}
                                />
                                {field.unit && <span className="field-unit">{field.unit}</span>}
                            </div>
                        )}

                        {field.type === 'select' && (
                            <select
                                className="field-select"
                                value={values[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                required={field.required}
                            >
                                <option value="">Sélectionner...</option>
                                {field.options?.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === 'radio' && (
                            <div className="field-radio-group">
                                {field.options?.map((option) => (
                                    <label key={option} className="radio-label">
                                        <input
                                            type="radio"
                                            name={field.name}
                                            value={option}
                                            checked={values[field.name] === option}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            required={field.required}
                                        />
                                        <span className="radio-text">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
