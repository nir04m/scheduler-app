# Scheduler App

A full-stack scheduling application for creating polls, collecting participant availability, comparing responses, and finalizing a meeting time.

The application is designed around a simple workflow: an organizer creates a poll with several possible times, shares the public link with participants, reviews everyone's availability, and selects the final meeting time.

Once a poll is finalized, it becomes read-only and participants can no longer modify their responses.

## Features

- Create scheduling polls with multiple date/time options
- Optional poll descriptions
- Timezone-aware scheduling
- Shareable public participant links
- Private organizer access
- Submit availability for each proposed time
- Availability states:
  - Available
  - Maybe
  - Can't make it
- Update an existing participant response
- View aggregated poll results
- Identify the strongest meeting options
- Organizer management view
- Edit polls before finalization
- Finalize a selected meeting time
- Finalized meeting summary
- Closed/read-only state after finalization
- Responsive interface for desktop and mobile
- Rate limiting and security middleware
- Separate development, test, and production database configurations
- Automated backend tests

## Tech Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Sonner
- ESLint
- Vercel

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Supabase
- Jest
- Express Rate Limit
- Helmet
- Render

## Architecture

```text
Browser
   |
   v
Next.js Frontend
Vercel
   |
   | /api/backend/*
   v
Next.js API Proxy
   |
   v
Express REST API
Render
   |
   v
Prisma ORM
   |
   v
Supabase
PostgreSQL
```

The browser communicates with the Next.js application. Backend requests are forwarded through a Next.js API proxy to the Express API hosted on Render.

The production Express application connects to PostgreSQL through the Supabase Session Pooler.

## Project Structure

```text
scheduler-app/
|
├── client/                  # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
│
├── server/                  # Express backend
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── libs/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── tests/
│   └── package.json
│
└── README.md
```

## Application Flow

### 1. Create a Poll

The organizer enters:

- Poll title
- Optional description
- Timezone
- Two or more proposed meeting times

After creation, the organizer receives a public participant link and private organizer access.

### 2. Share the Poll

The public poll URL can be shared with participants.

Organizer credentials are kept separate from the public participant URL.

### 3. Submit Availability

Participants enter their name and choose an availability status for each proposed time.

Responses are stored in PostgreSQL.

A participant response token allows the same participant/browser to update the response later without exposing organizer credentials.

### 4. Review Results

Poll results aggregate participant availability across all proposed times.

The interface allows participants and the organizer to compare which options work best for the group.

### 5. Organizer Management

The organizer can access the private organizer view to review responses and manage the poll.

Poll changes are permitted only while the poll remains open.

### 6. Finalize the Poll

The organizer selects the final meeting time.

After finalization:

- The selected meeting time is displayed
- The poll becomes closed
- Participant responses cannot be changed
- Poll configuration cannot be modified
- The finalized result remains available for viewing

This behavior is intentional to preserve the final scheduling decision.

## API

The Express application exposes REST endpoints under:

```text
/api
```

Poll operations include routes for:

```text
POST   /api/polls
GET    /api/polls/:publicId
PATCH  /api/polls/:publicId
POST   /api/polls/:publicId/responses
PATCH  /api/polls/:publicId/responses/:responseToken
POST   /api/polls/:publicId/finalize
```

The exact organizer authorization requirements depend on the operation.

A health endpoint is also available:

```text
GET /api/health
```

## Local Development

Clone the repository:

```bash
git clone <repository-url>
cd scheduler-app
```

### Backend

```bash
cd server
npm install
```

Configure the required backend environment variables in your local environment file.

Then generate the Prisma client:

```bash
npx prisma generate
```

Run the development server:

```bash
npm run dev
```

### Frontend

From another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend can then be opened at:

```text
http://localhost:3000
```

## Environment Configuration

Environment variables and database credentials should never be committed to Git.

Example frontend configuration:

```env
BACKEND_API_URL=http://localhost:<backend-port>
```

Production uses the deployed Render backend instead.

The backend requires its own environment configuration, including the PostgreSQL connection string and application configuration.

Production database connections use the Supabase Session Pooler rather than the direct IPv6 database endpoint.

## Database Environments

Development, testing, and production should use separate databases.

```text
Development
    ↓
Development Database

Automated Tests
    ↓
Test Database

Production
    ↓
Production Supabase Database
```

This prevents development work and automated tests from deleting or modifying production data.

Never run destructive development migrations or test cleanup against the production database.

## Testing

Backend tests can be run with:

```bash
cd server
npm test
```

The test suite covers core application behavior including poll creation, participant responses, response updates, and poll management.

Before deploying changes, run:

```bash
npm test
npm run build
```

For the frontend:

```bash
cd client
npm run lint
npm run build
```

## Deployment

### Frontend

The Next.js frontend is deployed on Vercel.

The Vercel project's root directory is:

```text
client
```

Production configuration includes:

```text
BACKEND_API_URL=<Render backend URL>
```

### Backend

The Express API is deployed on Render.

Render builds the TypeScript application and generates the Prisma client before starting the compiled server.

### Database

Production PostgreSQL is hosted by Supabase.

The deployed Render application connects through the Supabase Session Pooler to provide an IPv4-compatible database connection.

## Security

The application includes several security measures:

- Private organizer credentials
- Participant response tokens
- Server-side environment variables
- Input validation
- Rate limiting
- HTTP security headers
- Parameterized database access through Prisma
- Separate production and test databases
- Closed polls become read-only

Secrets, database passwords, organizer credentials, and environment files must not be committed to the repository.

## Future Improvements

### Automatic Results Refresh

Currently, users may need to refresh the page to see availability submitted by other participants.

A future version should automatically update an open poll when another participant submits or changes availability.

Possible implementations include:

- Supabase Realtime
- Server-Sent Events (SSE)
- WebSockets
- Lightweight client-side polling

This should apply only while a poll is open. Finalized polls are intentionally immutable.

### Additional Ideas

- Email invitations
- Calendar integration
- `.ics` calendar export
- Improved timezone selection
- Poll expiration dates
- Organizer dashboard for multiple polls
- Participant removal by organizers
- Accessibility improvements
- End-to-end browser testing
- Custom domains

## Production Status

The application currently supports the complete scheduling workflow:

```text
Create Poll
     ↓
Share Poll
     ↓
Submit Availability
     ↓
Update Availability
     ↓
Review Results
     ↓
Organizer Management
     ↓
Finalize Meeting
     ↓
Poll Closed / Read Only
```

The frontend, backend, database, participant update flow, organizer flow, and poll finalization flow have been tested together in production.

## License

This project is currently intended as a personal software development project.
