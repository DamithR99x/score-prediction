"""
Module for extracting and storing player statistics from T20 matches.
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from .models import MatchData, Innings
from collections import defaultdict


def extract_combined_player_stats_from_match(match_id: str, match: MatchData) -> List[Dict[str, Any]]:
    """Extract combined batting and bowling statistics for all players across both innings of a match."""
    if not match.innings or len(match.innings) < 1:
        return []

    match_date = match.info.dates[0] if hasattr(match.info, 'dates') and match.info.dates else 'unknown'
    venue = match.info.venue or 'Unknown'

    # Get both teams
    teams = match.info.teams if hasattr(match.info, 'teams') and match.info.teams else []
    if len(teams) < 2:
        return []
    
    # Track stats for all players across both innings
    all_batting_stats = {}
    all_bowling_stats = {}
    player_teams = {}  # Track which team each player belongs to

    # Process all available innings (first and second)
    for innings in match.innings:
        batting_team = innings.team
        bowling_team = teams[1] if teams[0] == batting_team else teams[0]
        
        # Extract batting stats from this innings
        for over in innings.overs:
            for delivery in over.deliveries:
                batter = delivery.batter
                if batter not in all_batting_stats:
                    all_batting_stats[batter] = {'runs': 0, 'balls_faced': 0, 'fours': 0, 'sixes': 0, 'dots_faced': 0, 'dismissed': False}
                    player_teams[batter] = batting_team
                
                runs_by_batter = delivery.runs.batter
                all_batting_stats[batter]['runs'] += runs_by_batter
                
                if not delivery.extras or 'wides' not in delivery.extras:
                    all_batting_stats[batter]['balls_faced'] += 1
                
                if runs_by_batter == 4:
                    all_batting_stats[batter]['fours'] += 1
                elif runs_by_batter == 6:
                    all_batting_stats[batter]['sixes'] += 1
                
                if runs_by_batter == 0 and (not delivery.extras or not delivery.extras.get('wides')):
                    all_batting_stats[batter]['dots_faced'] += 1
                
                if delivery.wickets:
                    for wicket in delivery.wickets:
                        if wicket.player_out == batter:
                            all_batting_stats[batter]['dismissed'] = True
        
        # Extract bowling stats from this innings
        for over in innings.overs:
            for delivery in over.deliveries:
                bowler = delivery.bowler
                if bowler not in all_bowling_stats:
                    all_bowling_stats[bowler] = {'balls_bowled': 0, 'runs_conceded': 0, 'wickets': 0, 'wides': 0, 'noballs': 0, 'dots_bowled': 0}
                    player_teams[bowler] = bowling_team
                
                if not delivery.extras or ('wides' not in delivery.extras and 'noballs' not in delivery.extras):
                    all_bowling_stats[bowler]['balls_bowled'] += 1
                
                all_bowling_stats[bowler]['runs_conceded'] += delivery.runs.total
                
                if delivery.wickets:
                    for wicket in delivery.wickets:
                        if wicket.kind and wicket.kind.lower() != 'run out':
                            all_bowling_stats[bowler]['wickets'] += 1
                
                if delivery.extras:
                    if 'wides' in delivery.extras:
                        all_bowling_stats[bowler]['wides'] += delivery.extras['wides']
                    if 'noballs' in delivery.extras:
                        all_bowling_stats[bowler]['noballs'] += delivery.extras['noballs']
                
                if delivery.runs.total == 0:
                    all_bowling_stats[bowler]['dots_bowled'] += 1

    # Combine stats for all players
    all_players = set(all_batting_stats.keys()) | set(all_bowling_stats.keys())
    result = []

    for player in all_players:
        player_data = {'match_id': match_id, 'date': match_date, 'venue': venue, 'player': player}

        if player in all_batting_stats:
            bstats = all_batting_stats[player]
            batting_team = player_teams.get(player)
            player_data.update({
                'batting_team': batting_team,
                'runs': bstats['runs'],
                'balls_faced': bstats['balls_faced'],
                'fours': bstats['fours'],
                'sixes': bstats['sixes'],
                'dots_faced': bstats['dots_faced'],
                'dismissed': 1 if bstats['dismissed'] else 0,
                'strike_rate': round((bstats['runs'] / bstats['balls_faced'] * 100), 2) if bstats['balls_faced'] > 0 else None
            })
        else:
            player_data.update({'batting_team': None, 'runs': None, 'balls_faced': None, 'fours': None, 'sixes': None, 'dots_faced': None, 'dismissed': None, 'strike_rate': None})

        if player in all_bowling_stats:
            bowstats = all_bowling_stats[player]
            bowling_team = player_teams.get(player) if player not in all_batting_stats else [t for t in teams if t != player_teams.get(player)][0] if player in player_teams else None
            
            overs_bowled = bowstats['balls_bowled'] // 6
            balls_in_partial_over = bowstats['balls_bowled'] % 6
            overs = overs_bowled + (balls_in_partial_over / 10)

            player_data.update({
                'bowling_team': bowling_team,
                'overs': round(overs, 1) if overs > 0 else None,
                'balls_bowled': bowstats['balls_bowled'],
                'runs_conceded': bowstats['runs_conceded'],
                'wickets': bowstats['wickets'],
                'wides': bowstats['wides'],
                'noballs': bowstats['noballs'],
                'dots_bowled': bowstats['dots_bowled'],
                'economy': round((bowstats['runs_conceded'] / overs), 2) if overs > 0 else None
            })
        else:
            player_data.update({'bowling_team': None, 'overs': None, 'balls_bowled': None, 'runs_conceded': None, 'wickets': None, 'wides': None, 'noballs': None, 'dots_bowled': None, 'economy': None})

        result.append(player_data)

    return result


def extract_combined_stats(matches: List[Tuple[str, MatchData]]) -> List[Dict[str, Any]]:
    """Extract combined batting and bowling statistics from all matches (across both innings)."""
    all_stats = []
    for match_id, match in matches:
        match_stats = extract_combined_player_stats_from_match(match_id, match)
        all_stats.extend(match_stats)
    return all_stats


def save_player_stats_to_db(stats: List[Dict[str, Any]], db_path: Path, table_name: str = 'player_stats', verbose: bool = True) -> None:
    """Save combined player statistics (batting and bowling) to SQLite database."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            match_id TEXT, date TEXT, venue TEXT, player TEXT,
            batting_team TEXT, runs INTEGER, balls_faced INTEGER, fours INTEGER, sixes INTEGER, dots_faced INTEGER, dismissed INTEGER, strike_rate REAL,
            bowling_team TEXT, overs REAL, balls_bowled INTEGER, runs_conceded INTEGER, wickets INTEGER, wides INTEGER, noballs INTEGER, dots_bowled INTEGER, economy REAL
        )
    """)

    cursor.execute(f"DELETE FROM {table_name}")

    cursor.executemany(f"""
        INSERT INTO {table_name} (match_id, date, venue, player, batting_team, runs, balls_faced, fours, sixes, dots_faced, dismissed, strike_rate, bowling_team, overs, balls_bowled, runs_conceded, wickets, wides, noballs, dots_bowled, economy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [(s['match_id'], s['date'], s['venue'], s['player'], s['batting_team'], s['runs'], s['balls_faced'], s['fours'], s['sixes'], s['dots_faced'], s['dismissed'], s['strike_rate'], s['bowling_team'], s['overs'], s['balls_bowled'], s['runs_conceded'], s['wickets'], s['wides'], s['noballs'], s['dots_bowled'], s['economy']) for s in stats])

    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_player ON {table_name}(player)")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_venue ON {table_name}(venue)")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_batting_team ON {table_name}(batting_team)")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_bowling_team ON {table_name}(bowling_team)")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_date ON {table_name}(date)")

    conn.commit()
    conn.close()

    if verbose:
        print(f"Saved {len(stats)} player records to {table_name} table in {db_path}")


def process_and_save_player_stats(project_root: Path, gender: str = 'male', table_name: str = 'player_stats', verbose: bool = True) -> None:
    """Complete workflow: load matches, extract combined player stats (batting and bowling) from both innings, and save to database."""
    from .match_loader import load_filtered_matches

    if verbose:
        print("=" * 60)
        print("EXTRACTING PLAYER STATISTICS FROM ALL INNINGS")
        print("=" * 60)

    matches = load_filtered_matches(project_root, gender=gender, verbose=verbose)

    if verbose:
        print(f"\nExtracting combined player stats from {len(matches)} matches...")

    player_stats = extract_combined_stats(matches)

    if verbose:
        print(f"Extracted stats for {len(player_stats)} player records")
        unique_players = len(set(s['player'] for s in player_stats))
        players_who_batted = sum(1 for s in player_stats if s['runs'] is not None)
        players_who_bowled = sum(1 for s in player_stats if s['wickets'] is not None)
        players_both = sum(1 for s in player_stats if s['runs'] is not None and s['wickets'] is not None)
        print(f"Unique players: {unique_players}")
        print(f"Player records with batting: {players_who_batted}")
        print(f"Player records with bowling: {players_who_bowled}")
        print(f"Player records with both batting and bowling: {players_both}")

    db_path = project_root / 't20s_json' / 'venue_metrics.db'
    save_player_stats_to_db(player_stats, db_path, table_name=table_name, verbose=verbose)

    if verbose:
        print("=" * 60)
        print("COMPLETED")
        print("=" * 60)
