import { useState, useEffect } from "react";

import './ToastMessage.css'

function ToastMessage({message="", type='error', key}){
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (message === '') return
        function update(){
            setIsVisible(true)
            const timeout = setTimeout(() => setIsVisible(false), 4000)
            return () => clearTimeout(timeout)
        }
        update()
    }, [message, key])

    return (
        <div className={`ToastMessage ${type} ${isVisible?"":'hidden'}`}>
            <div className="message">{message}</div>
            <button className="dismiss" onClick={()=>setIsVisible(false)}>✖</button>
        </div>
    )
}

export default ToastMessage;
