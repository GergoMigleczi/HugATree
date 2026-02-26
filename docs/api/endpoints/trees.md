#
# POST /trees

Creates a new tree and an initial observation. Requires authentication.

**Endpoint:** POST /trees

**Request body:**

JSON object with two required properties: `tree` and `observation`.

```
{
	"tree": {
		"speciesId": int|null,           // optional
		"plantedAt": string|null,        // optional, ISO8601 date
		"plantedBy": string|null,        // optional
		"locationLat": float,            // required
		"locationLng": float,            // required
		"addressText": string|null       // optional
	},
	"observation": {
		"title": string|null,            // optional
		"noteText": string|null,         // optional
		"observedAt": string|null,       // optional, ISO8601 date
		"details": {                     // optional
			"probableAgeYears": int|null,
			"ageBasis": string|null,
			"heightM": float|null,
			"heightMethod": string|null,
			"trunkDiameterCm": float|null,
			"diameterHeightCm": float|null,
			"diameterMethod": string|null,
			"canopyDiameterM": float|null,
			"canopyDensity": string|null
		},
		"photos": [                      // optional
			{ "storageKey": string }
		]
	}
}
```

**Request example:**

curl -X POST "http://0.0.0.0:8000/trees" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <token>" \
	-d '{
		"tree": {
			"speciesId": 45,
			"locationLat": 47.4979,
			"locationLng": 19.0402
		},
		"observation": {
			"title": "Planted today",
			"observedAt": "2026-02-26T12:00:00Z"
		}
	}'

**Response:**

Returns HTTP 201 with JSON body:

```
{
	"treeId": int,
	"observationId": int
}
```

- On missing or invalid fields, returns HTTP 400 with an error message.
- Requires a valid access token (Bearer auth).
# /trees

Simple documentation for the `/trees` endpoint.

**Endpoint:** GET /trees

**Query parameters:**
- `minLat` (required) — minimum latitude of the bounding box.
- `minLng` (required) — minimum longitude of the bounding box.
- `maxLat` (required) — maximum latitude of the bounding box.
- `maxLng` (required) — maximum longitude of the bounding box.
- `limit` (optional) — maximum number of items to return (integer, default: 5000).

The service expects numeric values for the bounding box coordinates. Values are validated against latitude/longitude ranges.

**Request example:**

curl -X GET "http://0.0.0.0:8000/trees?minLat=18.0&minLng=18&maxLat=18&maxLng=18&limit=100" -H "Accept: application/json"

If your API requires authentication, include an `Authorization` header: `Authorization: Bearer <token>`.

**Response:**

Returns HTTP 200 with a JSON object containing `items` and `count`.

- `items`: array of tree objects.
- `count`: integer number of items in the `items` array.

Each tree object has the following shape:

{
	"id": int,
	"speciesId": int|null,
	"speciesCommonName": string|null,
	"lat": float,
	"lng": float
}

Example response:

{
	"items": [
		{
			"id": 123,
			"speciesId": 45,
			"speciesCommonName": "English oak",
			"lat": 47.497912,
			"lng": 19.040235
		}
	],
	"count": 1
}

- If required query parameters are missing or malformed the API returns an error (HTTP 400).
- If no trees match the query, the API returns `200` with `items: []` and `count: 0`.

