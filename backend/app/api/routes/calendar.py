from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core import google_calendar as gcal
from app.core.config import settings
from app.models.google_account import GoogleAccount
from app.schemas.calendar import CalendarEvent, CalendarStatus, GoogleAuthUrl

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _get_account(db: Session) -> GoogleAccount | None:
    return db.execute(select(GoogleAccount)).scalars().first()


def _valid_access_token(db: Session, account: GoogleAccount) -> str:
    now = datetime.now(timezone.utc)
    if (
        account.access_token
        and account.access_token_expires_at
        and account.access_token_expires_at > now + timedelta(seconds=30)
    ):
        return account.access_token

    tokens = gcal.refresh_access_token(account.refresh_token)
    account.access_token = tokens["access_token"]
    account.access_token_expires_at = now + timedelta(seconds=tokens.get("expires_in", 3600))
    db.commit()
    return account.access_token


@router.get("/status", response_model=CalendarStatus)
def status(db: Session = Depends(get_db)):
    account = _get_account(db)
    if not account:
        return CalendarStatus(connected=False)
    return CalendarStatus(connected=True, email=account.email)


@router.get("/google/auth-url", response_model=GoogleAuthUrl)
def auth_url():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured on this server")
    return GoogleAuthUrl(url=gcal.build_auth_url())


@router.get("/google/callback")
def callback(code: str | None = None, error: str | None = None, db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/calendar?error={error or 'missing_code'}")

    try:
        tokens = gcal.exchange_code(code)
        access_token = tokens["access_token"]
        userinfo = gcal.fetch_userinfo(access_token)
    except httpx.HTTPStatusError:
        return RedirectResponse(f"{settings.FRONTEND_URL}/calendar?error=token_exchange_failed")

    refresh_token_value = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)

    account = _get_account(db)
    if not account:
        if not refresh_token_value:
            # Google only returns a refresh_token on first consent; if the user
            # previously connected and revoked access outside this app, prompt=consent
            # above should still force one, but guard anyway.
            return RedirectResponse(f"{settings.FRONTEND_URL}/calendar?error=no_refresh_token")
        account = GoogleAccount(refresh_token=refresh_token_value)
        db.add(account)

    if refresh_token_value:
        account.refresh_token = refresh_token_value
    account.access_token = access_token
    account.access_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    account.email = userinfo.get("email")

    db.commit()
    return RedirectResponse(f"{settings.FRONTEND_URL}/calendar?connected=1")


@router.delete("/google")
def disconnect(db: Session = Depends(get_db)):
    account = _get_account(db)
    if account:
        db.delete(account)
        db.commit()
    return {"status": "disconnected"}


@router.get("/events", response_model=list[CalendarEvent])
def events(days: int = 30, db: Session = Depends(get_db)):
    account = _get_account(db)
    if not account:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")

    try:
        access_token = _valid_access_token(db, account)
        now = datetime.now(timezone.utc)
        raw_events = gcal.fetch_events(access_token, now, now + timedelta(days=days))
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=401, detail="Google Calendar connection expired, please reconnect")

    result = []
    for e in raw_events:
        start = e.get("start", {})
        end = e.get("end", {})
        result.append(
            CalendarEvent(
                id=e["id"],
                summary=e.get("summary", "(No title)"),
                start=start.get("dateTime") or start.get("date"),
                end=end.get("dateTime") or end.get("date"),
                all_day="date" in start,
                location=e.get("location"),
                html_link=e.get("htmlLink"),
            )
        )
    return result
