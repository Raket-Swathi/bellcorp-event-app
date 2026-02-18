import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error('Fetch event details error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/registrations/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Registered successfully');
    } catch (err) {
      alert(
        err.response?.data?.message || 'Could not register for this event'
      );
    }
  };

  if (loading || !event) {
    return <p style={{ padding: 20 }}>Loading event details...</p>;
  }

    return (
    <div className="app-page">
      <div className="app-header">
        <div className="app-title">Event Details</div>
        <button className="btn secondary" onClick={() => navigate('/events')}>
          Back to Events
        </button>
      </div>

      <div className="form-card">
        <h1 style={{ marginTop: 0 }}>{event.name}</h1>
        
<p style={{ marginTop: 4, marginBottom: 12 }}>
  <span
    style={{
      fontWeight: 600,
    }}
  >
    Organized by
  </span>{' '}
  <span style={{ fontWeight: 600 }}>
    {event.organizer}
  </span>
</p>


        <p>
          <strong>Date &amp; Time:</strong>{' '}
          {new Date(event.date).toLocaleString()}
        </p>
        <p>
          <strong>Location:</strong> {event.location}
        </p>
        <p>
          <strong>Category:</strong> {event.category}
        </p>
        <p>
          <strong>Capacity:</strong> {event.capacity} total,{' '}
          {event.availableSeats} available
        </p>

        <h3 style={{ marginTop: 16 }}>Description</h3>
        <p>{event.description}</p>

        <div style={{ marginTop: 20 }}>
          {user ? (
            event.availableSeats > 0 ? (
              <button className="btn" onClick={handleRegister}>
                Register Now
              </button>
            ) : (
              <span style={{ color: '#f97373' }}>Sold Out</span>
            )
          ) : (
            <button
              className="btn secondary"
              onClick={() => navigate('/login')}
            >
              Login to Register
            </button>
          )}
        </div>
      </div>
    </div>
  );

}
