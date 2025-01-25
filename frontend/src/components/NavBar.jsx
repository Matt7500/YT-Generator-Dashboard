import '../css/NavBar.css'

function NavBar() {
    return (
        <div className="navbar">
            <h1>NavBar</h1>
            <div className="navbar-buttons">
                <button className="main-settings-btn">Settings</button>
                <button className="logout-btn">Logout</button>
            </div>
        </div>
    )
}

export default NavBar