import { useNavigate } from 'react-router-dom';
import './EditButton.css'

function EditButton({handleEdit, link, disabled}){
    const navigate = useNavigate()
    const fn = () =>{
        if (handleEdit) handleEdit()
        else navigate(link)
    }

    return (
        <div className="EditButton tooltip">
            <button className="edit" onClick={fn} disabled={disabled}>✎</button>
            <span className='tooltiptext'>edit</span>
        </div>
    )
}

export default EditButton;