import '../css/NavBar.css'

function NavBar() {
    return (
        <div className="navbar">
            <h1>NavBar</h1>
            <div className="nav-links">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
            </div>
        </div>
    )
}

export default NavBar