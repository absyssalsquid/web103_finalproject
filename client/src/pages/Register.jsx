import {useState} from 'react'
import { useNavigate, Link} from 'react-router-dom'

import { useAuthContext } from '/src/contexts/auth'

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const { isAuthenticated, register } = useAuthContext()

    const [RegisterParams, setRegisterParams] = useState({email: '', username: '', password: '', password2: ''})
    const [alertMsg, setAlertMsg] = useState('')

    const handleChange = (e) => {
        if (alertMsg) setAlertMsg('')
        setRegisterParams({
            ...RegisterParams,
            [e.target.name]: e.target.value,
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        const data = await register(RegisterParams)
        if (!data.error) {
            setAlertMsg('Signed in. You will be redirected shortly.');
            nav('/');
        }
        else{
            setAlertMsg(data.error);
        }
    }

    if (isAuthenticated) {
        return(<div className='sign-in'>
            <div className='minimal'>
                You are already signed in!
            </div>
        </div>)
    }

    return (
        <div className='sign-in '>

            <div className='header'>
                <h2>Register </h2>
                <p>or <Link to={"/register"}>sign in</Link></p>
            </div>

            <form className='form'>
                <input
                    name='email'
                    placeholder='email'
                    onChange={handleChange}
                />

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

            {alertMsg && <div className='error-msg'>{alertMsg}</div>}
        </div>
    )

}
export default SignIn