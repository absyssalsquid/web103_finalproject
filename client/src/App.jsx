import { Link, useNavigate, useRoutes } from 'react-router-dom'

import Docket from './pages/Docket'
import Dashboard from './pages/Dashboard'
import NewCase from './pages/NewCase'
import Case from './pages/Case'
import UserProfile from './pages/UserProfile'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import JuryDuty from './pages/JuryDuty'
import JuryBallot from './pages/JuryBallot'
import Guidelines from './pages/Guidelines'
import EditProfile from './pages/EditProfile'

import { useAuthContext } from '/src/contexts/auth'

import './App.css'


function App() {
  const nav = useNavigate();
  const { user, isAuthenticated, logout} = useAuthContext()

  const element = useRoutes([
    {'path': '/'           , 'element': <Docket />},
    {'path': '/guidelines'    , 'element': <Guidelines />},

    {'path': '/sign-in'    , 'element': <SignIn />},
    {'path': '/register'    , 'element': <Register />},
    
    {'path': '/dashboard/*' , 'element': <Dashboard />},
    {'path': '/new-case'   , 'element': <NewCase/>},
    {'path': '/cases/:id/*'   , 'element': <Case />},
    
    {'path': '/users/:id/*'   , 'element': <UserProfile />},
    {'path': '/profile/edit'   , 'element': <EditProfile />},
    {'path': '/profile/*'    , 'element': <UserProfile />},

    {'path': '/jury/serve/'   , 'element': <JuryDuty />},
    {'path': '/jury/ballot/:id' , 'element': <JuryBallot />},
  ]);

  function handleLogout(){
    logout()
    nav('/')
  }

  return (
      <>
        <nav className='Navigation'>
          <Link    className='nav-logo' to="/">Bird Court</Link>
          <div className='flex-grow'></div>
          <Link className="nav-item" to="/guidelines">???</Link>
          { (isAuthenticated) && (<Link className="nav-item" to="/dashboard">Dashboard </Link>) }
          { (!isAuthenticated) && (<Link className='nav-item' to="/sign-in">Sign&nbsp;in</Link>) } 
          { (isAuthenticated) && (<div className="nav-item" onClick={()=>handleLogout()}>Sign&nbsp;out </div>) }
          { (isAuthenticated && user) && (
            <Link className="nav-item" to={`/profile`}>
              <img src={user.image_url}  className='user-icon'/>
            </Link>
          ) }
          {/* all conditions set to userID for testing, to see all tabs */}
        </nav>

        {element}
      </>
  )
}

export default App

