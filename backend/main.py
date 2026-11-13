"""Optional account/save service. Gameplay runs entirely in the browser."""
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import create_engine, String, DateTime, ForeignKey, Text, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./deep-command.db')
engine = create_engine(DATABASE_URL, **({'connect_args': {'check_same_thread': False}} if DATABASE_URL.startswith('sqlite') else {}))
SessionLocal = sessionmaker(engine, expire_on_commit=False)
class Base(DeclarativeBase):
    pass
class Player(Base):
    __tablename__ = 'players'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
class LoginSession(Base):
    __tablename__ = 'sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    player_id: Mapped[str] = mapped_column(ForeignKey('players.id'), index=True)
    expires: Mapped[datetime] = mapped_column(DateTime(timezone=True))
class Save(Base):
    __tablename__ = 'saves'
    player_id: Mapped[str] = mapped_column(ForeignKey('players.id'), primary_key=True)
    payload: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
class BodyLimitMiddleware:
    """Bound API mutation bodies before JSON validation, including chunked requests."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or scope['method'] not in ('POST', 'PUT') or not scope['path'].startswith('/api/'):
            return await self.app(scope, receive, send)
        chunks, total = [], 0
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            chunk = message.get('body', b'')
            total += len(chunk)
            if total > 2_100_000:
                return await JSONResponse({'detail': 'Request body too large'}, status_code=413)(scope, receive, send)
            chunks.append(chunk)
            if not message.get('more_body', False):
                break
        body = b''.join(chunks)
        delivered = False
        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {'type': 'http.request', 'body': body, 'more_body': False}
            return await receive()
        await self.app(scope, replay, send)

app = FastAPI(title='DEEP COMMAND API', version='0.3.0')
app.add_middleware(BodyLimitMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173,http://localhost:8080').split(','),allow_methods=['GET','POST','PUT','DELETE'],allow_headers=['Authorization','Content-Type'])
bearer = HTTPBearer(auto_error=False)

def db():
    with SessionLocal() as session:
        yield session

def utc(value: datetime):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

def password_hash(password: str, salt: str | None = None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return salt + ':' + digest

class AuthInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    username: str = Field(min_length=3, max_length=40, pattern=r'^[a-zA-Z0-9_-]+$')
    password: str = Field(min_length=10, max_length=128)
class SaveInput(BaseModel):
    schema_name: str = Field(alias='schema', pattern='^deep-command-v1$')
    state: dict
    expected_revision: str | None = Field(default=None, max_length=64)

_attempts: dict[str, deque] = defaultdict(deque)
_rate_lock = Lock()
def limit(request: Request):
    # Per-process limiter; production multi-worker deployment needs an edge/Redis limiter.
    key = request.client.host if request.client else 'unknown'
    now = time.monotonic()
    with _rate_lock:
        while len(_attempts)>10000:
            _attempts.pop(next(iter(_attempts)))
        q = _attempts[key]
        while q and q[0]<now-60:
            q.popleft()
        if len(q)>=20:
            raise HTTPException(429,'Too many attempts. Retry in one minute.')
        q.append(now)

def current(credentials: HTTPAuthorizationCredentials | None=Depends(bearer), session: Session=Depends(db)):
    if not credentials:
        raise HTTPException(401,'Authentication required')
    token_hash=hashlib.sha256(credentials.credentials.encode()).hexdigest()
    login=session.get(LoginSession,token_hash)
    if not login or utc(login.expires)<datetime.now(timezone.utc):
        raise HTTPException(401,'Invalid or expired session')
    player=session.get(Player,login.player_id)
    if not player:
        raise HTTPException(401,'Player not found')
    return player

@app.get('/health')
def health(session: Session=Depends(db)):
    session.execute(text('SELECT 1'))
    return {'status':'ok'}
@app.get('/api/version')
def version():
    return {'version':'0.3.0','stage':'alpha','simulation':'fictional','frontend_mode':'local-first'}
@app.post('/api/auth/register',status_code=201,dependencies=[Depends(limit)])
def register(data: AuthInput,session: Session=Depends(db)):
    username=data.username.lower()
    if session.scalar(select(Player).where(Player.username==username)):
        raise HTTPException(409,'Username already exists')
    player=Player(id=secrets.token_hex(16),username=username,password_hash=password_hash(data.password))
    session.add(player)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(409,'Unable to create account')
    return {'id':player.id,'username':player.username}
@app.post('/api/auth/login',dependencies=[Depends(limit)])
def login(data: AuthInput,response: Response,session: Session=Depends(db)):
    player=session.scalar(select(Player).where(Player.username==data.username.lower()))
    encoded=player.password_hash if player else password_hash('dummy_password_value')
    candidate=password_hash(data.password,encoded.split(':')[0])
    if not player or not hmac.compare_digest(candidate,encoded):
        raise HTTPException(401,'Invalid username or password')
    token=secrets.token_urlsafe(48)
    expires=datetime.now(timezone.utc)+timedelta(hours=24)
    session.add(LoginSession(token_hash=hashlib.sha256(token.encode()).hexdigest(),player_id=player.id,expires=expires))
    session.commit()
    response.headers['Cache-Control']='no-store'
    return {'access_token':token,'token_type':'bearer','expires_in':86400}
@app.get('/api/player/profile')
def profile(response: Response,player: Player=Depends(current)):
    response.headers['Cache-Control']='no-store'
    return {'id':player.id,'username':player.username}
def revision(save: Save):
    return utc(save.updated_at).isoformat(timespec='microseconds')

@app.put('/api/player/save')
def put_save(data: SaveInput,player: Player=Depends(current),session: Session=Depends(db)):
    payload=data.model_dump_json(by_alias=True,exclude={'expected_revision'})
    if len(payload.encode())>2_000_000:
        raise HTTPException(413,'Save too large')
    if data.state.get('version')!=1:
        raise HTTPException(422,'Unsupported save version')
    save=session.get(Save,player.id)
    now=datetime.now(timezone.utc)
    if save:
        if data.expected_revision!=revision(save):
            raise HTTPException(409,'Cloud save changed. Fetch the latest revision before saving.')
        # Compare-and-swap also prevents two writers that read the same version.
        old_time=save.updated_at
        if now<=utc(old_time):
            now=utc(old_time)+timedelta(microseconds=1)
        changed=session.execute(update(Save).where(Save.player_id==player.id,Save.updated_at==old_time).values(payload=payload,updated_at=now),execution_options={'synchronize_session':False})
        if changed.rowcount!=1:
            session.rollback()
            raise HTTPException(409,'Cloud save changed. Fetch the latest revision before saving.')
    else:
        if data.expected_revision is not None:
            raise HTTPException(409,'Cloud save no longer exists. Fetch before saving.')
        session.add(Save(player_id=player.id,payload=payload,updated_at=now))
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409,'Cloud save was created by another session. Fetch before saving.')
    return {'status':'saved','updated_at':now.isoformat(),'revision':now.isoformat(timespec='microseconds')}

@app.get('/api/player/save')
def get_save(response: Response,player: Player=Depends(current),session: Session=Depends(db)):
    save=session.get(Save,player.id)
    if not save:
        raise HTTPException(404,'No save found')
    response.headers['Cache-Control']='no-store'
    return {**json.loads(save.payload),'revision':revision(save)}

@app.delete('/api/auth/logout',status_code=204)
def logout(credentials: HTTPAuthorizationCredentials=Depends(bearer),player: Player=Depends(current),session: Session=Depends(db)):
    login=session.get(LoginSession,hashlib.sha256(credentials.credentials.encode()).hexdigest())
    if login:
        session.delete(login)
        session.commit()
    return Response(status_code=204)
