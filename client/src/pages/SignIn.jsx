import {useState, useEffect} from 'react'

import { useNavigate,Link } from 'react-router-dom'

import {login,  getCurrentUserID} from "../api/auth.js"

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const [user, setUser] = useState({})
    const [signInParams, setSignInParams] = useState({username: '', password: ''})
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(()=>{
        // check if user is signed in
        async function init(){
            const res = await getCurrentUserID();
            if (res) setUser(res);
        }
        init()
    },[])

    const handleChange = (e) => {
        if (errorMsg) setErrorMsg('')
        var newSignInParams = {
            ...signInParams,
            [e.target.name]: e.target.value,
        }
        setSignInParams(newSignInParams)
    }

    const handleSignIn = async (e) => {
        e.preventDefault()
        const res = await login(signInParams)
        if (res.error) setErrorMsg(res.msg)
        else{
            setErrorMsg(res.msg)
            nav('/')
        }
    }

    if (user.user_id) {
        return(<div className='sign-in'>You are already signed in!</div>)
    }

    return (
        <div className='sign-in '>
            <div className='heading'>Sign in or <Link to={"/register"}>register</Link> for an account</div>

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

            {errorMsg && <div className='error-msg'>{errorMsg}</div>}
        </div>
    )

}
export default SignIn