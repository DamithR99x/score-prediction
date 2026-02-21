"""
Module for loading and filtering T20 match data from JSON files.
"""

import json
from pathlib import Path
from typing import List, Tuple
from .models import MatchData


def load_all_matches(json_dir: Path, verbose: bool = True) -> List[Tuple[str, MatchData]]:
    """
    Load all match data from JSON files in the specified directory.
    
    Args:
        json_dir: Path to directory containing match JSON files
        verbose: Whether to print progress information
        
    Returns:
        List of tuples (match_id, MatchData) where match_id is the filename without extension
    """
    all_json_files = sorted(json_dir.glob('*.json'))
    
    if verbose:
        print(f"Found {len(all_json_files)} JSON files in {json_dir.name} directory")
    
    all_matches = []
    errors = 0
    
    for json_file_path in all_json_files:
        try:
            with open(json_file_path, 'r') as f:
                json_data = json.load(f)
            
            # Convert to Python objects using Pydantic's model_validate
            match_data = MatchData.model_validate(json_data)
            match_id = json_file_path.stem  # filename without extension
            all_matches.append((match_id, match_data))
        except Exception as e:
            errors += 1
            if verbose:
                print(f"Error processing {json_file_path.name}: {e}")
    
    if verbose:
        print(f"Successfully loaded {len(all_matches)} matches")
        if errors > 0:
            print(f"Errors: {errors}")
    
    return all_matches


def filter_no_result_matches(matches: List[Tuple[str, MatchData]], verbose: bool = True) -> List[Tuple[str, MatchData]]:
    """
    Filter out matches with outcome "no result".
    
    Args:
        matches: List of tuples (match_id, MatchData)
        verbose: Whether to print filtering information
        
    Returns:
        Filtered list of tuples (match_id, MatchData)
    """
    original_count = len(matches)
    
    filtered_matches = []
    for match_id, md in matches:
        outcome = getattr(md.info, 'outcome', None)
        result = getattr(outcome, 'result', None)
        if isinstance(result, str) and result.strip().lower() == 'no result':
            continue
        filtered_matches.append((match_id, md))
    
    if verbose:
        excluded_count = original_count - len(filtered_matches)
        print(f"Filtered 'no result' matches: {original_count} → {len(filtered_matches)} (excluded: {excluded_count})")
    
    return filtered_matches


def filter_incomplete_innings(matches: List[Tuple[str, MatchData]], verbose: bool = True) -> List[Tuple[str, MatchData]]:
    """
    Filter out matches where first innings has < 20 overs AND < 10 wickets.
    This removes matches with incomplete first innings.
    
    Args:
        matches: List of tuples (match_id, MatchData)
        verbose: Whether to print filtering information
        
    Returns:
        Filtered list of tuples (match_id, MatchData)
    """
    original_count = len(matches)
    
    kept = []
    excluded_count = 0
    
    for match_id, md in matches:
        if not md.innings:
            kept.append((match_id, md))
            continue
            
        first_innings = md.innings[0]
        overs_count = len(first_innings.overs)
        
        # Count wickets
        wickets_count = 0
        for over in first_innings.overs:
            for delivery in over.deliveries:
                if delivery.wickets:
                    wickets_count += len(delivery.wickets)
        
        # Exclude if both conditions are true: overs < 20 AND wickets < 10
        if overs_count < 20 and wickets_count < 10:
            excluded_count += 1
        else:
            kept.append((match_id, md))
    
    if verbose:
        print(f"Filtered incomplete innings: {original_count} → {len(kept)} (excluded: {excluded_count})")
    
    return kept


def load_filtered_matches(
    project_root: Path,
    gender: str = 'male',
    verbose: bool = True
) -> List[Tuple[str, MatchData]]:
    """
    Load and filter T20 match data to get matches with valid results and complete innings.
    
    This function:
    1. Loads all matches from JSON files
    2. Filters out matches with "no result" outcome
    3. Filters out matches with incomplete first innings (< 20 overs AND < 10 wickets)
    
    Args:
        project_root: Path to project root directory
        gender: 'male' or 'female' subdirectory to load from
        verbose: Whether to print progress information
        
    Returns:
        List of filtered MatchData objects (all_matches_with_result_and_20_overs)
    """
    json_dir = project_root / 't20s_json' / gender
    
    if verbose:
        print("=" * 60)
        print("LOADING AND FILTERING T20 MATCH DATA")
        print("=" * 60)
    
    # Load all matches
    all_matches = load_all_matches(json_dir, verbose=verbose)
    
    # Filter out "no result" matches
    matches_with_result = filter_no_result_matches(all_matches, verbose=verbose)
    
    # Filter out incomplete innings
    matches_with_result_and_20_overs = filter_incomplete_innings(matches_with_result, verbose=verbose)
    
    if verbose:
        print("=" * 60)
        print(f"Final dataset: {len(matches_with_result_and_20_overs)} matches")
        print("=" * 60)
    
    return matches_with_result_and_20_overs
