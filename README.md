
  # Credibility Scoring Website

  This is a code bundle for Credibility Scoring Website. The original project is available at https://www.figma.com/design/HdSspDPYpTMNvgf5m2FvZx/Credibility-Scoring-Website.

  ## Running the code

  Run `npm i` to install the dependencies.

  To enable LLM-generated explanations, set `OPENAI_API_KEY` before starting the server. You can optionally set `OPENAI_MODEL`; otherwise the backend uses `gpt-5.4-mini`.

  Run `npm run dev` to start the frontend and backend development servers together.

  The frontend runs with Vite, usually at `http://localhost:5173`.

  The backend API runs at `http://localhost:3001` and exposes:

  - `GET /api/health`
  - `POST /api/analyze` with JSON body `{ "text": "Text to score" }`

  You can also run them separately:

  - `npm run dev:client`
  - `npm run dev:server`

  ## Docker

  Build and run the application locally:

  ```sh
  docker build -t credibility-scoring-website .
  docker run --rm -p 3001:3001 --env OPENAI_API_KEY="$OPENAI_API_KEY" credibility-scoring-website
  ```

  Then open `http://localhost:3001`.

  Publish to Docker Hub:

  ```sh
  docker login
  docker build -t YOUR_DOCKERHUB_USERNAME/credibility-scoring-website:latest .
  docker push YOUR_DOCKERHUB_USERNAME/credibility-scoring-website:latest
  ```

  Docker Hub image link format:

  `https://hub.docker.com/r/aidenh0/credibility-scoring-website`
  
