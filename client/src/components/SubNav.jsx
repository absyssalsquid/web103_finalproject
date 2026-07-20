import { NavLink } from "react-router-dom";
import './SubNav.css'
function SubNav({items}){
    return (
        <div className="SubNav">
            {items.map((item, idx)=>(
                <NavLink className="nav-link" key={idx} to={item.href}>
                    <span className='nav-text'>{item.text}</span>
                </NavLink>
            ))}
        </div>
    )
}

export default SubNav;