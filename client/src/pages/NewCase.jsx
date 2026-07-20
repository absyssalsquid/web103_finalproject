import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from "/src/components/ProgressBar"

import './NewCase.css'
import { LIMITS } from '/src/api/limits'

const NewCase = () => {
    const navigate = useNavigate();

    const [objectName, setObjectName] = useState('');
    const [accusation, setAccusation] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // TODO: replace with real count from the API once submissions are persisted
    const [submissionsUsed] = useState(1);

    const imageHandler = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setImage(null);
            setImagePreview(null);
            return;
        }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    }

    const submitHandler = (e) => {
        e.preventDefault();
        console.log('submit', { objectName, accusation, image });
        navigate('/');
    }

    const cancelHandler = (e) => {
        e.preventDefault();
        console.log('cancel');
        navigate('/');
    }

    const limitReached = submissionsUsed >= LIMITS.CASE_SUBMISSIONS;

    return (
        <div className="NewCase main-content">
            <h2>Submit a case</h2>
            <p>This object has offended birdkind!</p>

            <form onSubmit={submitHandler}>
                <div><label htmlFor="objectName">Object name</label></div>
                <input
                    id="objectName"
                    type="text"
                    value={objectName}
                    maxLength={LIMITS.OBJECT_NAME}
                    onChange={(e) => setObjectName(e.target.value)}
                    placeholder="e.g. the satellite dish"
                    required
                />
                <small>{objectName.length}/{LIMITS.OBJECT_NAME}</small>

                <div><label htmlFor="accusation">Accusation</label></div>
                <textarea
                    id="accusation"
                    value={accusation}
                    maxLength={LIMITS.ACCUSATION_LENGTH}
                    onChange={(e) => setAccusation(e.target.value)}
                    placeholder="describe the crime and alleged harm..."
                    rows={4}
                    required
                />
                <small>{accusation.length}/{LIMITS.ACCUSATION_LENGTH}</small>

                <div><label htmlFor="image">Object image (optional)</label></div>
                <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={imageHandler}
                />
                {imagePreview && (
                    <img
                        src={imagePreview}
                        alt="Evidence preview"
                        style={{ maxWidth: '200px', display: 'block', marginTop: '0.5rem' }}
                    />
                )}

                <ProgressBar
                    label="Daily case submissions"
                    value={submissionsUsed}
                    limit={LIMITS.CASE_SUBMISSIONS}
                />

                <div className="form-actions">
                    <button type="submit" disabled={limitReached}>
                        Submit case
                    </button>
                    <button type="button" onClick={cancelHandler}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

export default NewCase;
