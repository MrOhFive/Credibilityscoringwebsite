
  # Credibility Scoring Website

  This is a code bundle for Credibility Scoring Website. The original project is available at https://www.figma.com/design/HdSspDPYpTMNvgf5m2FvZx/Credibility-Scoring-Website.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the frontend and backend development servers together.

  The frontend runs with Vite, usually at `http://localhost:5173`.

  The backend API runs at `http://localhost:3001` and exposes:

  - `GET /api/health`
  - `POST /api/analyze` with JSON body `{ "text": "Text to score" }`

  You can also run them separately:

  - `npm run dev:client`
  - `npm run dev:server`
  
