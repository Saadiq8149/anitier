import useLocalStorage from "use-local-storage";

export default function Header() {
    // eslint-disable-next-line no-unused-vars
    const [auth, setAuth] = useLocalStorage("auth", {token: null, id: null, name: null})

    return (
      <header>
            <div className="logo">
                <div className="logo-text">Ani<span>Tier</span></div>
            </div>
            <div className="user-badge">
            <div className="user-meta">
                <span className="user-label">Active Session</span>
                <span className="user-name">{auth.name}</span>
            </div>
            <div className="user-tier anitier">Ani<span>List</span></div>
            </div>
      </header>
    )
}
