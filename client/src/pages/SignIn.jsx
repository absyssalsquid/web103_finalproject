import {useState, useEffect} from 'react'
import { useNavigate, Link } from 'react-router-dom'

import ToastMessage from '../components/ToastMessage'
import { useAuthContext } from '/src/contexts/auth'
import {getLengthLimits} from '/src/api/rules.js'

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const { isAuthenticated, login} = useAuthContext()

    const [signInParams, setSignInParams] = useState({username: '', password: ''})
    const [lengthLimits, setLengthLimits] = useState({})
    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})
    const [submitting, setSubmitting] = useState(false)

    useEffect(()=>{
        async function fetchData(){
            const res = await getLengthLimits()
            if (res.ok) {
                const data = await res.json()
                setLengthLimits(data)
            }
        }
        fetchData()
    },[])

    const handleChange = (e) => {
        var newSignInParams = {
            ...signInParams,
            [e.target.name]: e.target.value,
        }
        setSignInParams(newSignInParams)
    }

    const handleSignIn = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        const data = await login(signInParams);
        if (!data.error) {
            setToastMsg({message: 'Signed in. You will be redirected shortly.', type: 'success', key: Date.now()});
            setTimeout(() => nav('/'), 1700);
        }
        else{
            setToastMsg({message: data.error, type: 'error', key: Date.now()});
            setSubmitting(false)
        }
    }

    if (isAuthenticated) {
        return(<div className='sign-in main-content'>
            <div className='minimal'>
                <h2>You are already signed in!</h2>
            </div>
        </div>)
    }

    return (
        <div className='sign-in main-content'>
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className='header'>
                <h2>Sign in </h2>
                <p>or <Link to={"/register"}>register</Link> for an account</p>
            </div>

            <form onSubmit={handleSignIn}>
                <input
                    name='username'
                    placeholder='username'
                    onChange={handleChange}
                    minLength={lengthLimits.username_min}
                    maxLength={lengthLimits.username_max}
                />

                <input
                    name='password'
                    type="password"
                    placeholder='password'
                    onChange={handleChange}
                    minLength={lengthLimits.password_min}
                />
                <div className='form-actions'>
                    <button className='primary' type="submit" disabled={submitting}>Sign in</button>
                </div>
            </form>
        </div>
    )

}
export default SignIn