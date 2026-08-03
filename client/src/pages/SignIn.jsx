import {useState, useEffect} from 'react'
import { useNavigate, Link } from 'react-router-dom'

import ToastMessage from '../components/ToastMessage'
import { useAuthContext } from '/src/contexts/auth'

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const { isAuthenticated, login} = useAuthContext()

    const [signInParams, setSignInParams] = useState({username: '', password: ''})
    const [lengthLimits, setLengthLimits] = useState({})
    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})

    useEffect(()=>{
        // check if user is signed in
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
        const data = await login(signInParams);
        if (!data.error) {
            setToastMsg({message: 'Signed in. You will be redirected shortly.', type: 'success', key: Date.now()});
            nav('/');
        }
        else{
            setToastMsg({message: data.error, type: 'error', key: Date.now()});
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
                    <button className='primary' type="submit">Sign in</button>
                </div>
            </form>
        </div>
    )

}
export default SignIn