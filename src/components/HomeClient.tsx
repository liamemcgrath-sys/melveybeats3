<div className="w-full relative z-10">

  {/* TOP HEADER */}
  <header className="w-full border-b border-cyan-200 bg-white/80 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

      {/* LEFT: SITE TITLE */}
      <h1 className="text-3xl font-bold text-cyan-800">Melvey Beats</h1>

      {/* RIGHT: ADMIN LOGIN BUTTON */}
      {!isAdmin && (
        <button
          onClick={() => setShowAdminLogin(true)}
          className="btn-primary"
        >
          Admin Login
        </button>
      )}

      {/* RIGHT: EXIT ADMIN BUTTON */}
      {isAdmin && (
        <button
          onClick={() => setIsAdmin(false)}
          className="btn-secondary"
        >
          Exit Admin
        </button>
      )}
    </div>
  </header>
