# CareerConnect — Job and Internship Management Portal

The Applications module uses HTML, CSS, vanilla JavaScript, Fetch, and JSON Server. The existing Jobs, Internships, and Profile links are retained; those pages are not included in this checkout.

## Run locally

1. Install Node.js and npm if they are not already installed.
2. From the project root, start the JSON Server (JSON Server 0.17 syntax):

   ```sh
   npx json-server --watch db.json --port 3000
   ```

3. In a second terminal, serve this folder over HTTP, for example:

   ```sh
   python -m http.server 8000
   ```

4. Open `http://localhost:8000/applications/applications.html`.

Use a local HTTP server instead of opening the HTML files directly. To change the API host, define `window.CAREERCONNECT_API_URL` before `applications.js` loads.

## Application flow

Opportunity pages should link to `applications/apply.html` and pass available information as query parameters, for example:

`applications/apply.html?title=Frontend%20Developer&company=Example%20Co&type=job&location=Delhi&experience=Fresher&salary=As%20per%20company%20standards`

The form validates applicant details, checks the API for a duplicate application, then POSTs the record. The dashboard fetches all records and computes counts and filtered cards. Details fetch one record by its JSON Server ID. Withdrawal PATCHes the record status and appends an activity event; withdrawn records stay visible.

## API endpoints

- `GET /applications` — dashboard data and duplicate check
- `GET /applications/:id` — application details
- `POST /applications` — submit an application
- `PATCH /applications/:id` — withdraw an application

`db.json` includes `applications`, `notifications`, and `users` collections. The latter two are reserved for future module integration. Status transitions beyond withdrawal should be made by an employer/admin workflow that authenticates and authorizes the actor; this student demo does not provide that workflow. Resume URLs are supported; file uploads are not stored by JSON Server.

JSON Server is suitable for this classroom demonstration only. Do not put real applicant data in a publicly exposed JSON file.
