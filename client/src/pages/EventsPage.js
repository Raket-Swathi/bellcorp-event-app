import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://bellcorp-event-app-qij8.onrender.com/api';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (location) params.location = location;
      if (category) params.category = category;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await axios.get(`${API_BASE}/events`, { params });
      setEvents(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Fetch events error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/registrations/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Registered successfully');
      fetchEvents();
    } catch (err) {
      alert(
        err.response?.data?.message || 'Could not register for this event'
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // pagination helpers
  const totalPages = Math.ceil(events.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = events.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="app-page">
      <header className="app-header">
        <div className="app-title">Bellcorp Events</div>
        <div>
          {user && (
            <>
              <span className="small-text" style={{ marginRight: 10 }}>
                Signed in as {user.name}
              </span>
              <button
                className="btn secondary"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
              <button
                className="btn"
                onClick={handleLogout}
                style={{ marginLeft: 8 }}
              >
                Logout
              </button>
            </>
          )}
          {!user && (
            <>
              <button
                className="btn secondary"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                className="btn"
                onClick={() => navigate('/register')}
                style={{ marginLeft: 8 }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <form onSubmit={handleSearchSubmit} className="filters-row">
        <input
          className="form-input"
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="form-input"
          type="text"
          placeholder="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="form-input"
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="form-input"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          className="form-input"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <button className="btn" type="submit">
          Apply
        </button>
      </form>

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading events...</p>
      ) : (
        <>
          <div className="event-grid">
            {paginatedEvents.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-content">
                  <div
                    className="event-title event-line"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    {event.name}
                  </div>
                  <div className="event-meta event-line">
                    Organized by {event.organizer}
                  </div>
                  <div className="event-meta event-line">
                    {event.location}
                  </div>
                  <div className="event-meta event-line">
                    {new Date(event.date).toLocaleString()}
                  </div>
                  <div className="event-meta event-line">
                    {event.category}
                  </div>
                  <p className="event-description event-line">
                    {event.description}
                  </p>
                </div>
                <div className="event-footer">
                  <span>
                    Seats: {event.availableSeats} / {event.capacity}
                  </span>
                  {user ? (
                    event.availableSeats > 0 ? (
                      <button
                        className="btn"
                        onClick={() => handleRegister(event._id)}
                      >
                        Register
                      </button>
                    ) : (
                      <span style={{ color: '#b91c1c' }}>Sold Out</span>
                    )
                  ) : (
                    <button
                      className="btn secondary"
                      onClick={() => navigate('/login')}
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={page}
                  className={`page-btn ${
                    page === currentPage ? 'active' : ''
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
