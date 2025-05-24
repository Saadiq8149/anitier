/* eslint-disable no-unused-vars */
import './App.css'
import Header from './components/Header'
import Main from './components/Main'

function App() {
    const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

    if (isMobile) {
      return (
          <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              width: '100vw',
              padding: '20px',
              backgroundColor: 'var(--dark-bg)',
              color: 'var(--text)',
              textAlign: 'center',
              overflow: 'hidden', // Prevent scrolling
              position: 'fixed', // Lock the viewport
              top: 0,
              left: 0
          }}>
              <div style={{
                  padding: '24px',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                  maxWidth: '400px',
                  width: '100%',
                  boxSizing: 'border-box' // Ensure padding doesn't affect width
              }}>
                  <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      marginBottom: '16px',
                      color: 'var(--text)'
                  }}>
                      Ani<span style={{color: 'var(--accent)'}}>Tier</span>
                  </div>
                  <div style={{
                      fontSize: '16px',
                      marginBottom: '24px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5'
                  }}>
                      Sorry, <span style={{color: 'var(--text)'}}>Ani</span><span style={{color: 'var(--accent)'}}>Tier</span> is not available on mobile devices.
                  </div>
              </div>
              <div style={{
                  marginTop: '24px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  maxWidth: '400px',
                  width: '100%',
                  padding: '0 20px',
                  boxSizing: 'border-box'
              }}>
                  Please visit from a desktop computer to access <span style={{color: 'var(--text)'}}>Ani</span><span style={{color: 'var(--accent)'}}>Tier</span>.
              </div>
          </div>
      );
    } else {
        return (
          <>
            <Header/>
            <Main/>
          </>
        )
    }
}

export default App
