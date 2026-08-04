import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import ProgressBar from "/src/components/ProgressBar"
import TopAlert from "/src/components/TopAlert"
import ToastMessage from "/src/components/ToastMessage"

import { useAuthContext } from '/src/contexts/auth'

import { getUsage } from '/src/api/me'
import { getUserLimits, getLengthLimits } from '/src/api/rules'


import './CaseForm.css'

const CaseForm = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAuthLoading } = useAuthContext();
    const fileInputRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [userLimits, setUserLimits] = useState({})
    const [lengthLimits, setLengthLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })
    const [caseParams, setCaseParams] = useState({object_name: '', accusation: '', image: null})
    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})

    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        async function fetchData(){
            if (isAuthenticated){
                const res = await Promise.all([
                    getUserLimits(),
                    getLengthLimits(),
                    getUsage()
                ])

                const data = await Promise.all(
                    res.map((item) => item.json()))

                setUserLimits(data[0])
                setLengthLimits(data[1])
                setUsage(data[2])
            }   
            setLoading(false)
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
        setCaseParams({
            ...caseParams,
            [e.target.name]: e.target.value,
        })
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        setSubmitting(true)

        const formData = new FormData();
        formData.append("object_name", caseParams.object_name);
        formData.append("accusation", caseParams.accusation);
        formData.append("image", caseParams.image);

        const options = {
            method: "POST",
            credentials: "include",
            body: formData,
        }
        const res = await fetch(`/api/cases`, options);
        const data = await res.json()

        if (res.ok){
            setToastMsg({message: `Case #${data.case_id} successfully created.`, type: 'success', key: Date.now()})
            setTimeout(() => {
                navigate('/');
            }, 1000);
        }
        else {
            setToastMsg({message: data.error, type: 'error', key: Date.now()})
        }
        setSubmitting(false)
    }

    const cancelHandler = (e) => {
        e.preventDefault();
        console.log('cancel');
        navigate('/');
    }

    const limitReached = usage.cases >= userLimits.cases;
    if (loading || isAuthLoading) {
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading case form...</h1>
                    <div className='loader'></div>
                </div>
            </div>
        )
    }

    return (
        <div className="CaseForm main-content">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            {(!isAuthenticated) &&
                <TopAlert message={(<><Link to={"/sign-in"}>Sign in</Link> to submit a case</>)} />
            }

            <div className='card-outer-container'>

                <div className='header-container'>
                <div className='header'>
                    <h2>Submit a case</h2>
                    <p>This object has offended birdkind!</p>
                </div>
                </div>

                <form onSubmit={submitHandler}>
                    
                    <div><label htmlFor="objectName">Object name</label></div>
                    <textarea
                        className='obj-name'
                        name="object_name"
                        type="text"
                        value={caseParams.object_name}
                        minLength={lengthLimits.object_name_min}
                        maxLength={lengthLimits.object_name_max}
                        onChange={handleChange}
                        placeholder="e.g. the satellite dish"
                        rows={2}
                        required
                    />
                    <small className="char-limit">{caseParams.object_name.length}/{lengthLimits.object_name_max}</small>

                    <div><label htmlFor="accusation">Accusation</label></div>
                    <textarea
                        className='accusation'
                        name="accusation"
                        value={caseParams.accusation}
                        minLength={lengthLimits.accusation_min}
                        maxLength={lengthLimits.accusation_max}
                        onChange={handleChange}
                        placeholder="describe the crime and alleged harm..."
                        rows={8}
                        required
                    />
                    <small className="char-limit">{caseParams.accusation.length}/{lengthLimits.accusation_max}</small>

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
                        limit={userLimits.cases}
                        limit_message={"You've reached your daily submission limit."}
                    />

                    <div className="form-actions">
                        <button type="submit" disabled={!isAuthenticated || limitReached || submitting }>
                            {submitting ? "Submitting..." : "Submit case"}
                        </button>
                        <button type="button" onClick={cancelHandler}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

        </div>
    )
}

export default CaseForm;
