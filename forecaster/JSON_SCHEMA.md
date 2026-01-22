# T20 Match JSON Structure Schema

This document describes the complete structure of the T20 match JSON files.

## Root Level

```json
{
  "meta": { ... },
  "info": { ... },
  "innings": [ ... ]
}
```

## Meta Object

```json
{
  "data_version": "string (e.g., '1.0.0')",
  "created": "string (date in YYYY-MM-DD format)",
  "revision": "integer"
}
```

## Info Object

```json
{
  "balls_per_over": "integer (typically 6)",
  "city": "string",
  "dates": ["string (YYYY-MM-DD)"],
  "gender": "string ('male' or 'female')",
  "match_type": "string (e.g., 'T20')",
  "match_type_number": "integer",
  "officials": {
    "match_referees": ["string"],
    "tv_umpires": ["string"],
    "umpires": ["string"],
    "reserve_umpires": ["string"] // optional
  },
  "outcome": {
    "by": {
      "runs": "integer", // optional, present if won by runs
      "wickets": "integer" // optional, present if won by wickets
    },
    "winner": "string (team name)"
  },
  "overs": "integer (typically 20 for T20)",
  "player_of_match": ["string"], // optional, can be empty array
  "players": {
    "TeamName1": ["string (player names)"],
    "TeamName2": ["string (player names)"]
  },
  "registry": {
    "people": {
      "Player Name": "string (unique player ID)"
    }
  },
  "season": "integer or string",
  "team_type": "string ('international' or 'club')",
  "teams": ["string (team names)"],
  "toss": {
    "decision": "string ('bat' or 'field')",
    "winner": "string (team name)"
  },
  "venue": "string",
  "event": { // optional
    "name": "string",
    "match_number": "integer"
  },
  "missing": ["string"] // optional, e.g., ['umpires', 'player_of_match']
}
```

## Innings Array

Array of innings objects (typically 2 for T20 matches):

```json
[
  {
    "team": "string (team name)",
    "overs": [ ... ],
    "powerplays": [ ... ],
    "target": { ... } // optional, only present in second innings
  }
]
```

## Over Object

```json
{
  "over": "integer (0-indexed over number)",
  "deliveries": [ ... ]
}
```

## Delivery Object

```json
{
  "batter": "string (player name)",
  "bowler": "string (player name)",
  "non_striker": "string (player name)",
  "runs": {
    "batter": "integer",
    "extras": "integer",
    "total": "integer"
  },
  "extras": { // optional
    "wides": "integer",
    "noballs": "integer",
    "byes": "integer",
    "legbyes": "integer"
  },
  "wickets": [ // optional, present only if wicket fell
    {
      "kind": "string ('caught', 'bowled', 'lbw', 'run out', 'stumped', etc.)",
      "player_out": "string (player name)",
      "fielders": [ // optional, present for caught/run out/stumped
        {
          "name": "string (fielder name)"
        }
      ]
    }
  ]
}
```

## Powerplay Object

```json
{
  "from": "float (over number, e.g., 0.1)",
  "to": "float (over number, e.g., 5.6)",
  "type": "string (e.g., 'mandatory')"
}
```

## Target Object (Second Innings Only)

```json
{
  "overs": "integer",
  "runs": "integer"
}
```

## Notes

- All string fields are case-sensitive
- Player names should match exactly with registry entries
- Over numbers are 0-indexed (first over is 0, second is 1, etc.)
- Delivery numbers within an over can vary (e.g., 7 deliveries if there's a no-ball or wide)
- The `extras` field in a delivery is optional and only present when extras occurred
- The `wickets` field in a delivery is optional and only present when a wicket fell
- The `target` field is only present in the second innings

