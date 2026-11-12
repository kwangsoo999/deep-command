import os
os.environ['DATABASE_URL']='sqlite://'
import main
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
main.engine=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
main.SessionLocal=sessionmaker(main.engine,expire_on_commit=False)
main.Base.metadata.create_all(main.engine)
client=TestClient(main.app)
def auth(username):
    credentials={'username':username,'password':'test-password-strong'}
    assert client.post('/api/auth/register',json=credentials).status_code==201
    r=client.post('/api/auth/login',json=credentials)
    assert r.status_code==200
    return {'Authorization':'Bearer '+r.json()['access_token']}
def test_health_version():
    assert client.get('/health').json()=={'status':'ok'}
    assert client.get('/api/version').json()['stage']=='alpha'
def test_auth_save_isolation_and_revocation():
    a,b=auth('captain_a'),auth('captain_b')
    assert client.get('/api/player/profile').status_code==401
    assert client.get('/api/player/profile',headers=a).json()['username']=='captain_a'
    assert client.post('/api/auth/login',json={'username':'captain_a','password':'wrong-password'}).status_code==401
    assert client.post('/api/auth/register',json={'username':'captain_a','password':'test-password-strong'}).status_code==409
    payload={'schema':'deep-command-v1','state':{'version':1,'mission':0}}
    assert client.put('/api/player/save',json=payload,headers=a).status_code==200
    assert client.get('/api/player/save',headers=a).json()==payload
    assert client.get('/api/player/save',headers=b).status_code==404
    assert client.delete('/api/auth/logout',headers=a).status_code==204
    assert client.get('/api/player/profile',headers=a).status_code==401
def test_validation():
    assert client.post('/api/auth/register',json={'username':'bad<>','password':'short'}).status_code==422
    assert client.get('/api/player/save',headers={'Authorization':'Bearer invalid'}).status_code==401
