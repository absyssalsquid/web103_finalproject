import { useNavigate } from 'react-router-dom'

const NewCase = () => {
    const navigate = useNavigate();

    const submitHandler = (e) => {
        e.preventDefault();
        console.log('submit');
        navigate('/');
    }

    const cancelHandler = (e) => {
        e.preventDefault();
        console.log('cancel');
        navigate('/');
    }

    return (
        <div className="">
            New Case
            <form onSubmit={submitHandler}>
                <button type="submit">
                    Submit
                </button>
                <button type="button" onClick={cancelHandler}>
                    Cancel
                </button>
            </form>
        </div>
    )
}

export default NewCase;