from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# Base model to ignore unused/unknown properties
class ModelBase(BaseModel):
    model_config = ConfigDict(extra='ignore')


# Define Pydantic models for the JSON structure
class Meta(ModelBase):
    data_version: str
    created: str
    revision: int


class Officials(ModelBase):
    match_referees: List[str]
    umpires: List[str]


class Outcome(ModelBase):
    by: Dict[str, Any]
    winner: str


class Toss(ModelBase):
    decision: str
    winner: str


class MatchInfo(ModelBase):
    balls_per_over: int
    dates: List[str]
    gender: str
    match_type: str
    match_type_number: int
    # officials: Officials
    # outcome: Outcome
    overs: int
    players: Dict[str, List[str]]
    registry: Dict[str, Dict[str, str]]
    season: Any
    team_type: str
    teams: List[str]
    toss: Toss
    venue: str


class Runs(ModelBase):
    batter: int
    extras: int
    total: int


class Wicket(ModelBase):
    kind: str
    player_out: str
    fielders: Optional[List[Dict[str, Any]]] = None


class Delivery(ModelBase):
    batter: str
    bowler: str
    non_striker: str
    runs: Runs
    extras: Optional[Dict[str, int]] = None
    wickets: Optional[List[Wicket]] = None


class Over(ModelBase):
    over: int
    deliveries: List[Delivery]


class Powerplay(ModelBase):
    from_: float = Field(alias='from')
    to: float
    type: str
    
    model_config = ConfigDict(extra='ignore', populate_by_name=True)


class Target(ModelBase):
    overs: int
    runs: int


class Innings(ModelBase):
    team: str
    overs: List[Over]
    # powerplays: List[Powerplay]
    # target: Optional[Target] = None


class MatchData(ModelBase):
    meta: Meta
    info: MatchInfo
    innings: List[Innings]

