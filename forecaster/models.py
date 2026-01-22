from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


# Define Pydantic models for the JSON structure
class Meta(BaseModel):
    data_version: str
    created: str
    revision: int


class Officials(BaseModel):
    match_referees: List[str]
    tv_umpires: List[str]
    umpires: List[str]


class Outcome(BaseModel):
    by: Dict[str, Any]
    winner: str


class Toss(BaseModel):
    decision: str
    winner: str


class MatchInfo(BaseModel):
    balls_per_over: int
    city: str
    dates: List[str]
    gender: str
    match_type: str
    match_type_number: int
    officials: Officials
    outcome: Outcome
    overs: int
    player_of_match: List[str]
    players: Dict[str, List[str]]
    registry: Dict[str, Dict[str, str]]
    season: int
    team_type: str
    teams: List[str]
    toss: Toss
    venue: str


class Runs(BaseModel):
    batter: int
    extras: int
    total: int


class Wicket(BaseModel):
    kind: str
    player_out: str
    fielders: Optional[List[Dict[str, str]]] = None


class Delivery(BaseModel):
    batter: str
    bowler: str
    non_striker: str
    runs: Runs
    extras: Optional[Dict[str, int]] = None
    wickets: Optional[List[Wicket]] = None


class Over(BaseModel):
    over: int
    deliveries: List[Delivery]


class Powerplay(BaseModel):
    from_: float = Field(alias='from')
    to: float
    type: str
    
    model_config = {"populate_by_name": True}


class Target(BaseModel):
    overs: int
    runs: int


class Innings(BaseModel):
    team: str
    overs: List[Over]
    powerplays: List[Powerplay]
    target: Optional[Target] = None


class MatchData(BaseModel):
    meta: Meta
    info: MatchInfo
    innings: List[Innings]

