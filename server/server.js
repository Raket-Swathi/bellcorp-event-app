// ===== Imports and setup =====
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== Mongo connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// ===== Schemas & Models =====

// User: name, email (unique), password (hashed)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Event: name, organizer, location, date, description, capacity, category, availableSeats
const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, trim: true },
    availableSeats: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

// Registration: user, event, status (registered/cancelled)
const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },
  },
  { timestamps: true }
);

// Unique per user+event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

// ===== Auth Middleware =====
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Token failed' });
  }
};

// ===== Test route =====
app.get('/', (req, res) => {
  res.json({ message: 'Bellcorp Event API running' });
});

// ===== Auth Routes =====

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== Event routes =====

// GET /api/events (search + filters)
app.get('/api/events', async (req, res) => {
  try {
    const { search, category, location, dateFrom, dateTo } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Get events error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/:id
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('Get event error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== Registration routes =====

// POST /api/registrations/:eventId (register)
app.post('/api/registrations/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const existing = await Registration.findOne({
      user: req.user._id,
      event: event._id,
      status: 'registered',
    });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = await Registration.create({
      user: req.user._id,
      event: event._id,
      status: 'registered',
    });

    event.availableSeats -= 1;
    await event.save();

    res.status(201).json(registration);
  } catch (err) {
    console.error('Register event error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/registrations/:eventId (cancel)
app.delete('/api/registrations/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registration = await Registration.findOne({
      user: req.user._id,
      event: event._id,
      status: 'registered',
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'cancelled';
    await registration.save();

    event.availableSeats += 1;
    await event.save();

    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    console.error('Cancel event error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/registrations/me (dashboard: upcoming, past, cancelled)
app.get('/api/registrations/me', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user._id,
    }).populate('event');

    const now = new Date();
    const upcoming = [];
    const past = [];
    const cancelled = [];

    registrations.forEach((reg) => {
      if (!reg.event) return;

      if (reg.status === 'cancelled') {
        cancelled.push(reg.event);
      } else if (reg.status === 'registered') {
        if (reg.event.date > now) {
          upcoming.push(reg.event);
        } else {
          past.push(reg.event);
        }
      }
    });

    res.json({ upcoming, past, cancelled });
  } catch (err) {
    console.error('Get my registrations error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== Seeding route (20 events) =====

// GET /api/seed  -> delete all events, insert ~20
app.get('/api/seed', async (req, res) => {
  try {
    await Event.deleteMany({});

    const now = new Date();
    const daysFromNow = (n) =>
      new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

    const sampleEvents = [
      // Tech
      {
        name: 'React Conference',
        organizer: 'Bellcorp',
        location: 'Hyderabad',
        date: daysFromNow(5),
        description: 'A deep dive into React and ecosystem.',
        capacity: 100,
        availableSeats: 100,
        category: 'Tech',
      },
      {
        name: 'Node.js Summit',
        organizer: 'Dev Studio',
        location: 'Bangalore',
        date: daysFromNow(10),
        description: 'Advanced Node.js patterns and practices.',
        capacity: 80,
        availableSeats: 80,
        category: 'Tech',
      },
      {
        name: 'Fullstack Bootcamp',
        organizer: 'Code School',
        location: 'Online',
        date: daysFromNow(15),
        description: 'Hands-on MERN stack bootcamp.',
        capacity: 150,
        availableSeats: 150,
        category: 'Tech',
      },
      {
        name: 'APIs & Microservices',
        organizer: 'CloudHub',
        location: 'Hyderabad',
        date: daysFromNow(-3),
        description: 'Microservices and API best practices.',
        capacity: 120,
        availableSeats: 60,
        category: 'Tech',
      },

      // Business
      {
        name: 'Startup Meetup',
        organizer: 'Bellcorp Studio',
        location: 'Bangalore',
        date: daysFromNow(7),
        description: 'Networking for founders and investors.',
        capacity: 50,
        availableSeats: 50,
        category: 'Business',
      },
      {
        name: 'Product Management 101',
        organizer: 'PM Guild',
        location: 'Hyderabad',
        date: daysFromNow(2),
        description: 'Basics of product thinking and roadmapping.',
        capacity: 60,
        availableSeats: 60,
        category: 'Business',
      },
      {
        name: 'Growth Hacking Workshop',
        organizer: 'Marketing Hub',
        location: 'Mumbai',
        date: daysFromNow(12),
        description: 'Hands-on growth tactics for startups.',
        capacity: 70,
        availableSeats: 70,
        category: 'Business',
      },
      {
        name: 'Investor Pitch Night',
        organizer: 'Angel Network',
        location: 'Bangalore',
        date: daysFromNow(-5),
        description: 'Startups pitch to angel investors.',
        capacity: 40,
        availableSeats: 10,
        category: 'Business',
      },

      // Music
      {
        name: 'Music Festival',
        organizer: 'City Events',
        location: 'Hyderabad',
        date: daysFromNow(-2),
        description: 'Live performances from local bands.',
        capacity: 200,
        availableSeats: 120,
        category: 'Music',
      },
      {
        name: 'Indie Night',
        organizer: 'SoundWave',
        location: 'Hyderabad',
        date: daysFromNow(4),
        description: 'Indie artists and acoustic sessions.',
        capacity: 150,
        availableSeats: 150,
        category: 'Music',
      },
      {
        name: 'DJ Live Party',
        organizer: 'NightLife',
        location: 'Bangalore',
        date: daysFromNow(9),
        description: 'Electronic music and DJ performances.',
        capacity: 250,
        availableSeats: 200,
        category: 'Music',
      },
      {
        name: 'Classical Evening',
        organizer: 'Art Society',
        location: 'Chennai',
        date: daysFromNow(20),
        description: 'Classical music concert with renowned artists.',
        capacity: 180,
        availableSeats: 180,
        category: 'Music',
      },

      // Others
      {
        name: 'Design Meetup',
        organizer: 'UX Guild',
        location: 'Online',
        date: daysFromNow(3),
        description: 'UI/UX design trends and case studies.',
        capacity: 90,
        availableSeats: 90,
        category: 'Design',
      },
      {
        name: 'Hackathon 24h',
        organizer: 'Hack Club',
        location: 'Hyderabad',
        date: daysFromNow(1),
        description: '24-hour coding challenge for developers.',
        capacity: 120,
        availableSeats: 120,
        category: 'Tech',
      },
      {
        name: 'Data Science Summit',
        organizer: 'DataHub',
        location: 'Bangalore',
        date: daysFromNow(30),
        description: 'Talks on ML, AI, and data engineering.',
        capacity: 200,
        availableSeats: 200,
        category: 'Tech',
      },
      {
        name: 'Women in Tech Meetup',
        organizer: 'WomenWhoCode',
        location: 'Hyderabad',
        date: daysFromNow(14),
        description: 'Networking and talks for women in tech.',
        capacity: 100,
        availableSeats: 100,
        category: 'Tech',
      },
      {
        name: 'Startup Legal Basics',
        organizer: 'Law & Co',
        location: 'Online',
        date: daysFromNow(6),
        description: 'Legal basics every startup founder should know.',
        capacity: 80,
        availableSeats: 80,
        category: 'Business',
      },
      {
        name: 'Jazz Night',
        organizer: 'City Events',
        location: 'Hyderabad',
        date: daysFromNow(8),
        description: 'Jazz performances in an open-air venue.',
        capacity: 150,
        availableSeats: 150,
        category: 'Music',
      },
      {
        name: 'Corporate Training Day',
        organizer: 'SkillUp',
        location: 'Mumbai',
        date: daysFromNow(-1),
        description: 'Skill workshops for corporate employees.',
        capacity: 100,
        availableSeats: 50,
        category: 'Business',
      },
      {
        name: 'React Native Workshop',
        organizer: 'MobileDev',
        location: 'Hyderabad',
        date: daysFromNow(18),
        description: 'Build mobile apps with React Native.',
        capacity: 80,
        availableSeats: 80,
        category: 'Tech',
      },
    ];

    const events = await Event.insertMany(sampleEvents);
    res.json({ message: 'Seeded 20 events', count: events.length });
  } catch (err) {
    console.error('Seed error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
