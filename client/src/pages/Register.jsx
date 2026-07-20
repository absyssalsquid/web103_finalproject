import {useState, useEffect} from 'react'
import { useNavigate} from 'react-router-dom'

import {register, getCurrentUserID} from "../api/auth.js"

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const [user, setUser] = useState({})
    const [RegisterParams, setRegisterParams] = useState({username: '', password: '', password2: ''})
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
        var newRegisterParams = {
            ...RegisterParams,
            [e.target.name]: e.target.value,
        }
        setRegisterParams(newRegisterParams)
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        const res = await register(RegisterParams)
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
            <div className='heading'>Register for an account</div>

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
                <input
                    name='password2'
                    type="password"
                    placeholder='re-enter password'
                    onChange={handleChange}
                />
                <div className='form-actions'>
                    <button className='primary' onClick={handleRegister}>Register</button>
                </div>
            </form>

            {errorMsg && <div className='error-msg'>{errorMsg}</div>}
        </div>
    )

}
export default SignIn