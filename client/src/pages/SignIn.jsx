import {useState, useEffect} from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { useAuthContext } from '/src/contexts/auth'

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const { isAuthenticated, login} = useAuthContext()

    const [signInParams, setSignInParams] = useState({username: '', password: ''})
    const [alertMsg, setAlertMsg] = useState('')

    useEffect(()=>{
        // check if user is signed in
    },[])

    const handleChange = (e) => {
        if (alertMsg) setAlertMsg('')
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
            setAlertMsg('Signed in. You will be redirected shortly.');
            nav('/');
        }
        else{
            setAlertMsg(data.error);
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

            <div className='header'>
                <h2>Sign in </h2>
                <p>or <Link to={"/register"}>register</Link> for an account</p>
            </div>
            
            <form className='form'>
                <input
                    name='username'
                    placeholder='username'
                    onChange={handleChange}
                />

                <input
                    name='password'
                    type="password"
                    placeholder='password'
                    onChange={handleChange}
                />
                <div className='form-actions'>
                    <button className='primary' onClick={handleSignIn}>Sign in</button>
                </div>
            </form>

            {alertMsg && <div className='error-msg'>{alertMsg}</div>}
        </div>
    )

}
export default SignIn