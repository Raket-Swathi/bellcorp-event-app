// client/src/pages/DashboardPage.js
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://bellcorp-event-app-qij8.onrender.com/api';

const DashboardPage = () => {
  const { token, user } = useAuth();
  console.log('DASHBOARD AUTH:', { token, user });

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [cancelledEvents, setCancelledEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.get(`${API_BASE}/registrations/me`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      setUpcomingEvents(res.data.upcoming || []);
      setPastEvents(res.data.past || []);
      setCancelledEvents(res.data.cancelled || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load your events');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const handleCancel = async (eventId) => {
    try {
      await axios.delete(`${API_BASE}/registrations/${eventId}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
      fetchMyEvents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  if (loading) {
    return <p style={{ padding: '1rem' }}>Loading your events...</p>;
  }

  return (
    <div className="dashboard-page">
      <h1>My Events</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Upcoming */}
      <section>
        <h2>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p>No upcoming events.</p>
        ) : (
          <ul>
            {upcomingEvents.map((reg) => (
              <li key={reg._id}>
                <strong>{reg.event.name}</strong> –{' '}
                {new Date(reg.event.date).toLocaleString()} – {reg.event.location}
                <button
                  onClick={() => handleCancel(reg.event._id)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past */}
      <section>
        <h2>Past Events</h2>
        {pastEvents.length === 0 ? (
          <p>No past events.</p>
        ) : (
          <ul>
            {pastEvents.map((reg) => (
              <li key={reg._id}>
                <strong>{reg.event.name}</strong> –{' '}
                {new Date(reg.event.date).toLocaleString()} – {reg.event.location}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cancelled */}
      <section>
        <h2>Cancelled Events</h2>
        {cancelledEvents.length === 0 ? (
          <p>No cancelled events.</p>
        ) : (
          <ul>
            {cancelledEvents.map((reg) => (
              <li key={reg._id}>
                <strong>{reg.event.name}</strong> –{' '}
                {new Date(reg.event.date).toLocaleString()} – {reg.event.location}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
