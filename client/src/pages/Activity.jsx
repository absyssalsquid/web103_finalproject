import { NavLink, useRoutes } from 'react-router-dom'

const Activity = () => {
    const element = useRoutes([
        {'path': '/cases'            , 'element': <h2>cases</h2>},
        {'path': '/evidence'         , 'element': <h2>evidence</h2>},
        {'path': '/arguments'        , 'element': <h2>arguments</h2>},
        {'path': '/jury-assignments' , 'element': <h2>jury assignments</h2>},
    ]);
    
    return (
        <div className="activity">
            <nav>
                <NavLink className="nav-link" to="/activity/cases">Cases</NavLink>
                <NavLink className="nav-link" to="/activity/evidence">Evidence</NavLink>
                <NavLink className="nav-link" to="/activity/arguments">Arguments</NavLink>
                <NavLink className="nav-link" to="/activity/jury-assignments">Jury Assignments</NavLink>
            </nav>
            {element}
        </div>
    )
}
export default Activity;