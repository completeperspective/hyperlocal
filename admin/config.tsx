function CustomLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ margin: 0, fontSize: '2rem' }}>🏕️</span>
      <h3 style={{ margin: 0, marginLeft: '8px' }}>hyper[local]</h3>
    </div>
  )
}

export const components = {
  Logo: CustomLogo,
}
