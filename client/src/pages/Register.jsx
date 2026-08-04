import {useState} from 'react'
import { useNavigate, Link} from 'react-router-dom'

import ToastMessage from '../components/ToastMessage'
import CardHeader from '/src/components/card_fragments/CardHeader'
import { useAuthContext } from '/src/contexts/auth'

import './SignIn.css'

const SignIn = () =>{
    const nav = useNavigate();
    const { isAuthenticated, register } = useAuthContext()

    const [RegisterParams, setRegisterParams] = useState({email: '', username: '', password: '', password2: ''})
    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})

    const handleChange = (e) => {
        setRegisterParams({
            ...RegisterParams,
            [e.target.name]: e.target.value,
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        const data = await register(RegisterParams)
        if (!data.error) {
            setToastMsg({message: 'Signed in. You will be redirected shortly.', type: 'success', key: Date.now()});
            nav('/');
        }
        else{
            setToastMsg({message: data.error, type: 'error', key: Date.now()});
        }
    }

    if (isAuthenticated) {
        return(<div className='SignIn main-content'>
            <div className='minimal'>
                You are already signed in!
            </div>
        </div>)
    }

    return (
        <div className='SignIn main-content'>
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className='card-container'>
                <CardHeader title="Register" subtitle={<>or <Link to={"/sign-in"}>sign in</Link></>} />

                <div className='card'>
                    <form onSubmit={handleRegister}>
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
                            <button className='primary'>Register</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )

}
export default SignIn