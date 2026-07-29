from pydantic import BaseModel


class CalendarStatus(BaseModel):
    connected: bool
    email: str | None = None


class CalendarEvent(BaseModel):
    id: str
    summary: str
    start: str
    end: str
    all_day: bool
    location: str | None = None
    html_link: str | None = None


class GoogleAuthUrl(BaseModel):
    url: str
