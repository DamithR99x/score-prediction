"""
Module for aggregating player statistics and classifying players based on their performance.
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class PlayerAggregate:
    """Aggregated statistics for a player."""
    player: str
    matches: int
    total_runs: int
    total_balls_faced: int
    times_dismissed: int
    total_wickets: int
    total_overs: float
    total_balls_bowled: int
    total_runs_conceded: int
    matches_batted: int
    matches_bowled: int
    
    @property
    def bat_avg(self) -> float:
        """Batting average: total_runs / times_dismissed"""
        return self.total_runs / self.times_dismissed if self.times_dismissed > 0 else 0
    
    @property
    def bat_sr(self) -> float:
        """Batting strike rate: (total_runs / total_balls_faced) * 100"""
        return (self.total_runs / self.total_balls_faced * 100) if self.total_balls_faced > 0 else 0
    
    @property
    def bowl_avg(self) -> float:
        """Bowling average: total_runs_conceded / total_wickets"""
        return self.total_runs_conceded / self.total_wickets if self.total_wickets > 0 else 999
    
    @property
    def econ(self) -> float:
        """Economy rate: total_runs_conceded / total_overs"""
        return self.total_runs_conceded / self.total_overs if self.total_overs > 0 else 0
    
    @property
    def overs_per_match(self) -> float:
        """Average overs bowled per match"""
        return self.total_overs / self.matches if self.matches > 0 else 0


def classify_t20i_player(p: PlayerAggregate) -> str:
    """Classify a T20I player based on their statistics."""
    
    # Minimum data check
    if p.matches < 15 or (p.total_runs < 250 and p.total_wickets < 10):
        return "INSUFFICIENT_DATA"

    # 1️⃣ Specialist Bowler
    if (p.overs_per_match >= 3 and
        p.econ <= 8.2 and
        p.bowl_avg <= 26 and
        p.bat_avg < 20):
        return "BOWLER"

    # 2️⃣ Bowling All-Rounder
    if (p.overs_per_match >= 2 and
        p.total_wickets >= 25 and
        p.bat_avg >= 20 and
        p.bat_sr >= 120 and
        p.econ <= 8.8):
        return "ALL_ROUNDER"

    # 3️⃣ Batting All-Rounder
    if (p.overs_per_match >= 1 and
        p.total_wickets >= 20 and
        p.bat_avg >= 25 and
        p.bat_sr >= 130):
        return "ALL_ROUNDER"

    # 4️⃣ Specialist Batter
    if (p.bat_avg >= 28 and
        p.bat_sr >= 125 and
        p.overs_per_match < 0.5):
        return "BATTER"

    return "UTILITY_PLAYER"


def aggregate_player_stats(db_path: Path, source_table: str = 'player_stats') -> List[PlayerAggregate]:
    """Aggregate player statistics from the player_stats table."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    query = f"""
    SELECT 
        player,
        COUNT(DISTINCT match_id) as matches,
        COALESCE(SUM(CASE WHEN runs IS NOT NULL THEN runs ELSE 0 END), 0) as total_runs,
        COALESCE(SUM(CASE WHEN balls_faced IS NOT NULL THEN balls_faced ELSE 0 END), 0) as total_balls_faced,
        COALESCE(SUM(CASE WHEN dismissed IS NOT NULL THEN dismissed ELSE 0 END), 0) as times_dismissed,
        COALESCE(SUM(CASE WHEN wickets IS NOT NULL THEN wickets ELSE 0 END), 0) as total_wickets,
        COALESCE(SUM(CASE WHEN overs IS NOT NULL THEN overs ELSE 0 END), 0) as total_overs,
        COALESCE(SUM(CASE WHEN balls_bowled IS NOT NULL THEN balls_bowled ELSE 0 END), 0) as total_balls_bowled,
        COALESCE(SUM(CASE WHEN runs_conceded IS NOT NULL THEN runs_conceded ELSE 0 END), 0) as total_runs_conceded,
        COUNT(CASE WHEN runs IS NOT NULL THEN 1 END) as matches_batted,
        COUNT(CASE WHEN wickets IS NOT NULL THEN 1 END) as matches_bowled
    FROM {source_table}
    GROUP BY player
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    
    aggregates = []
    for row in results:
        agg = PlayerAggregate(
            player=row[0],
            matches=row[1],
            total_runs=row[2],
            total_balls_faced=row[3],
            times_dismissed=row[4],
            total_wickets=row[5],
            total_overs=row[6],
            total_balls_bowled=row[7],
            total_runs_conceded=row[8],
            matches_batted=row[9],
            matches_bowled=row[10]
        )
        aggregates.append(agg)
    
    return aggregates


def save_player_classifications(db_path: Path, source_table: str = 'player_stats', target_table: str = 'player_classifications', verbose: bool = True) -> None:
    """Aggregate player stats and save classifications to a new table."""
    
    if verbose:
        print("=" * 60)
        print("AGGREGATING AND CLASSIFYING PLAYERS")
        print("=" * 60)
    
    # Aggregate player stats
    if verbose:
        print(f"\nAggregating player statistics from {source_table}...")
    
    aggregates = aggregate_player_stats(db_path, source_table)
    
    if verbose:
        print(f"Aggregated stats for {len(aggregates)} players")
    
    # Classify players
    classifications = []
    for agg in aggregates:
        classification = classify_t20i_player(agg)
        classifications.append({
            'player': agg.player,
            'matches': agg.matches,
            'total_runs': agg.total_runs,
            'total_balls_faced': agg.total_balls_faced,
            'times_dismissed': agg.times_dismissed,
            'bat_avg': round(agg.bat_avg, 2),
            'bat_sr': round(agg.bat_sr, 2),
            'total_wickets': agg.total_wickets,
            'total_overs': round(agg.total_overs, 1),
            'total_runs_conceded': agg.total_runs_conceded,
            'bowl_avg': round(agg.bowl_avg, 2),
            'econ': round(agg.econ, 2),
            'overs_per_match': round(agg.overs_per_match, 2),
            'matches_batted': agg.matches_batted,
            'matches_bowled': agg.matches_bowled,
            'classification': classification
        })
    
    if verbose:
        print(f"Classified {len(classifications)} players")
        
        # Print classification summary
        from collections import Counter
        class_counts = Counter(c['classification'] for c in classifications)
        print("\nClassification Summary:")
        for cls, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {cls}: {count}")
    
    # Save to database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Create table
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {target_table} (
            player TEXT PRIMARY KEY,
            matches INTEGER,
            total_runs INTEGER,
            total_balls_faced INTEGER,
            times_dismissed INTEGER,
            bat_avg REAL,
            bat_sr REAL,
            total_wickets INTEGER,
            total_overs REAL,
            total_runs_conceded INTEGER,
            bowl_avg REAL,
            econ REAL,
            overs_per_match REAL,
            matches_batted INTEGER,
            matches_bowled INTEGER,
            classification TEXT
        )
    """)
    
    # Clear existing data
    cursor.execute(f"DELETE FROM {target_table}")
    
    # Insert classifications
    cursor.executemany(f"""
        INSERT INTO {target_table} 
        (player, matches, total_runs, total_balls_faced, times_dismissed, bat_avg, bat_sr,
         total_wickets, total_overs, total_runs_conceded, bowl_avg, econ, overs_per_match,
         matches_batted, matches_bowled, classification)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [(c['player'], c['matches'], c['total_runs'], c['total_balls_faced'], 
           c['times_dismissed'], c['bat_avg'], c['bat_sr'], c['total_wickets'],
           c['total_overs'], c['total_runs_conceded'], c['bowl_avg'], c['econ'],
           c['overs_per_match'], c['matches_batted'], c['matches_bowled'], c['classification']) 
          for c in classifications])
    
    # Create indexes
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{target_table}_classification ON {target_table}(classification)")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{target_table}_matches ON {target_table}(matches)")
    
    conn.commit()
    conn.close()
    
    if verbose:
        print(f"\nSaved {len(classifications)} player classifications to {target_table} table")
        print("=" * 60)
        print("COMPLETED")
        print("=" * 60)


def process_player_classifications(project_root: Path, source_table: str = 'player_stats', 
                                   target_table: str = 'player_classifications', verbose: bool = True) -> None:
    """Complete workflow: aggregate stats and classify players."""
    db_path = project_root / 't20s_json' / 'venue_metrics.db'
    save_player_classifications(db_path, source_table, target_table, verbose)
