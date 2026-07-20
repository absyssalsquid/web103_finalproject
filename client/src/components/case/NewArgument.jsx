import {useState} from 'react'

import { LIMITS } from '/src/api/limits'

function NewCase(){
    const [argument, setAccusation] = useState('');
    return (
        <div className="NewCase main-content">
            <form>
                <div><label htmlFor="argument">Argument</label></div>
                <textarea
                    id="argument"
                    value={argument}
                    maxLength={LIMITS.ARGUMENT_LENGTH}
                    onChange={(e) => setAccusation(e.target.value)}
                    placeholder="argue the case"
                    rows={4}
                    required
                />
                <small>{argument.length}/{LIMITS.ACCUSATION_LENGTH}</small>
                <button className="btn btn-primary" disabled={false}>+ Submit Argument</button>
                
            </form>

        </div>
    )
}

export default NewCase;


