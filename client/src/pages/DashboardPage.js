import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/registrations/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpcoming(res.data.upcoming || []);
      setPast(res.data.past || []);
      setCancelled(res.data.cancelled || []);
    } catch (err) {
      console.error('Fetch my events error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyEvents();
    }
  }, [token]);

  const handleCancel = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/registrations/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchMyEvents();
    } catch (err) {
      console.error('Cancel registration error', err);
      alert(
        err.response?.data?.message ||
          'Could not cancel registration. Please try again.'
      );
    }
  };

  if (!user) return <p style={{ padding: 20 }}>Please login.</p>;


  return (
    <div className="app-page">
      <div className="app-header">
        <div className="app-title">My Dashboard</div>
        <button className="btn secondary" onClick={() => navigate('/events')}>
          Back to Events
        </button>
      </div>

      {loading && <p>Loading your registrations...</p>}

      <div className="section-card">
        <h3>Upcoming Events</h3>
        {upcoming.length === 0 && <p className="small-text">No upcoming events.</p>}
        {upcoming.map((event) => (
          <div key={event._id} className="dashboard-row">
            <div>
              <strong>{event.name}</strong> –{' '}
              {new Date(event.date).toLocaleString()} ({event.location})
            </div>
            <button
              className="btn danger"
              onClick={() => handleCancel(event._id)}
            >
              Cancel
            </button>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h3>Past Events</h3>
        {past.length === 0 && <p className="small-text">No past events.</p>}
        {past.map((event) => (
          <div key={event._id} className="dashboard-row">
            <div>
              <strong>{event.name}</strong> –{' '}
              {new Date(event.date).toLocaleString()} ({event.location})
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h3>Cancelled Events</h3>
        {cancelled.length === 0 && (
          <p className="small-text">No cancelled events.</p>
        )}
        {cancelled.map((event) => (
          <div key={event._id} className="dashboard-row">
            <div>
              <strong>{event.name}</strong> –{' '}
              {new Date(event.date).toLocaleString()} ({event.location})
            </div>
          </div>
        ))}
      </div>
    </div>
  );

}
