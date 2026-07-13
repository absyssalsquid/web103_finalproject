import { Link, useRoutes } from 'react-router-dom'
import Docket from './pages/Docket'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import NewCase from './pages/NewCase'
import Case from './pages/Case'
import UserProfile from './pages/UserProfile'
import './App.css'

function App() {
  const element = useRoutes([
    {'path': '/'           , 'element': <Docket />},
    {'path': '/activity/*' , 'element': <Activity />},
    {'path': '/new-case'   , 'element': <NewCase/>},
    {'path': '/profile'    , 'element': <Profile />},
    {'path': '/cases/:id/*'   , 'element': <Case />},
    {'path': '/users/:id/*'   , 'element': <UserProfile />},
  ]);

  return (
      <>
        <nav className='Navigation'>
          <Link    className='nav-logo' to="/">Bird Court</Link>
          <div className='flex-grow'></div>
          <Link className="nav-link" to="/activity">Activity </Link>
          <Link className='nav-link' to="/profile">Profile</Link>
          <Link className='nav-link' to="/sign-in">Sign in</Link>
        </nav>

        {element}
      </>
  )
}

export default App

