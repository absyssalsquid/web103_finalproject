import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import ProgressBar from "/src/components/ProgressBar"

import { useAuthContext } from '/src/contexts/auth'

import { getUsage } from '/src/api/me'
import { LIMITS } from '/src/api/limits'


import './NewCase.css'
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const NewCase = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthContext();
    const fileInputRef = useRef(null);
    
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })
    const [caseParams, setCaseParams] = useState({object_name: '', accusation: '', image: null})
    const [alertMsg, setAlertMsg] = useState('')

    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        async function fetchData(){
            const res = await getUsage();
            if (res.ok) {
                const data = await res.json()
                setUsage(data)
            }
        }
        fetchData();
    }, []);


    const imageHandler = (e) => {
        const file = e.target.files[0];
        setCaseParams({
            ...caseParams,
            ['image']: file
        })
        setImagePreview(file ? URL.createObjectURL(file) : null);
    }

    function cancelImage(e) {
        e.preventDefault();
        setCaseParams({
            ...caseParams,
            ['image']: null
        })
        setImagePreview(null);
        fileInputRef.current.value = "";
    }

    const handleChange = (e) => {
        if (alertMsg) setAlertMsg('')
        setCaseParams({
            ...caseParams,
            [e.target.name]: e.target.value,
        })
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("object_name", caseParams.object_name);
        formData.append("accusation", caseParams.accusation);
        formData.append("image", caseParams.image);

        const options = {
            method: "POST",
            credentials: "include",
            body: formData,
        }
        const res = await fetch(`${API_BASE}/cases`, options);
        const data = await res.json()

        if (res.ok){
            setAlertMsg(`Case ${data.case_id} created`)
            navigate('/');
        }
        else {
            setAlertMsg(data.error)
        }
    }

    const cancelHandler = (e) => {
        e.preventDefault();
        console.log('cancel');
        navigate('/');
    }

    const limitReached = usage.cases >= LIMITS.CASE_SUBMISSIONS;

    return (
        <div className="NewCase">
            {(!isAuthenticated) &&
            <div className='form-block'>
                    <div className='alert'><div>⚠</div></div>
                    <div><Link to={"/sign-in"}>Sign in</Link> to submit a case</div>
            </div>
            }

            <div className='main-content'>

                <div className='header'>
                    <h2>Submit a case</h2>
                    <p>This object has offended birdkind!</p>
                </div>

                <form onSubmit={submitHandler}>
                    
                    <div><label htmlFor="objectName">Object name</label></div>
                    <textarea
                        className='obj-name'
                        name="object_name"
                        type="text"
                        value={caseParams.object_name}
                        maxLength={LIMITS.OBJECT_NAME}
                        onChange={handleChange}
                        placeholder="e.g. the satellite dish"
                        rows={2}
                        required
                    />
                    <small>{caseParams.object_name.length}/{LIMITS.OBJECT_NAME}</small>

                    <div><label htmlFor="accusation">Accusation</label></div>
                    <textarea
                        className='accusation'
                        name="accusation"
                        value={caseParams.accusation}
                        maxLength={LIMITS.ACCUSATION_LENGTH}
                        onChange={handleChange}
                        placeholder="describe the crime and alleged harm..."
                        rows={8}
                        required
                    />
                    <small>{caseParams.accusation.length}/{LIMITS.ACCUSATION_LENGTH}</small>

                    <div><label htmlFor="image">Object image (optional)</label></div>
                    <input
                        ref={fileInputRef}
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={imageHandler}
                    />
                    {imagePreview && (
                        <div className='evidence-img-container'>
                            <img
                                src={imagePreview}
                                alt="Evidence preview"
                            />
                            <button onClick={cancelImage}>✖</button>
                        </div>
                    )}

                    <ProgressBar
                        label="Daily case submissions"
                        value={usage.cases}
                        limit={LIMITS.CASE_SUBMISSIONS}
                    />

                    <div className="form-actions">
                        <button type="submit" disabled={limitReached || !isAuthenticated}>
                            Submit case
                        </button>
                        <button type="button" onClick={cancelHandler}>
                            Cancel
                        </button>
                    </div>
                </form>
                {alertMsg && <div className='error-msg'>{alertMsg}</div>}
            </div>

        </div>
    )
}

export default NewCase;
