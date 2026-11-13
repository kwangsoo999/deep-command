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
    saved=client.get('/api/player/save',headers=a).json()
    assert saved['state']==payload['state']
    assert saved['schema']==payload['schema']
    assert isinstance(saved['revision'],str)
    assert client.get('/api/player/save',headers=b).status_code==404
    assert client.delete('/api/auth/logout',headers=a).status_code==204
    assert client.get('/api/player/profile',headers=a).status_code==401
def test_validation():
    assert client.post('/api/auth/register',json={'username':'bad<>','password':'short'}).status_code==422
    assert client.get('/api/player/save',headers={'Authorization':'Bearer invalid'}).status_code==401

def test_cloud_revision_prevents_overwrite():
    headers=auth('captain_conflict')
    first={'schema':'deep-command-v1','state':{'version':1,'mission':0}}
    response=client.put('/api/player/save',json=first,headers=headers)
    assert response.status_code==200
    rev=response.json()['revision']
    fetched=client.get('/api/player/save',headers=headers).json()
    assert fetched['revision']==rev
    second={**first,'state':{'version':1,'mission':1},'expected_revision':rev}
    updated=client.put('/api/player/save',json=second,headers=headers)
    assert updated.status_code==200
    assert updated.json()['revision']!=rev
    assert client.put('/api/player/save',json=first,headers=headers).status_code==409
    assert client.put('/api/player/save',json=second,headers=headers).status_code==409
    latest=client.get('/api/player/save',headers=headers).json()
    assert latest['state']['mission']==1
    assert 'expected_revision' not in latest
    assert client.put('/api/player/save',json={**first,'expected_revision':latest['revision']},headers=headers).status_code==200

def test_cloud_missing_and_invalid_version():
    headers=auth('captain_missing')
    assert client.get('/api/player/save',headers=headers).status_code==404
    data={'schema':'deep-command-v1','state':{'version':1},'expected_revision':'stale-revision'}
    assert client.put('/api/player/save',json=data,headers=headers).status_code==409
    data['state']['version']=999
    assert client.put('/api/player/save',json=data,headers=headers).status_code==422


def test_browser_cors_policy():
    headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'authorization,content-type'}
    response=client.options('/api/player/save',headers=headers)
    assert response.status_code==200
    assert response.headers['access-control-allow-origin']=='http://localhost:5173'
    headers['Origin']='http://untrusted.invalid'
    assert client.options('/api/player/save',headers=headers).status_code==400


def test_request_limit_precedes_json_validation():
    response=client.post('/api/auth/login',content=b'x'*2_100_001,headers={'Content-Type':'application/json','Origin':'http://localhost:5173'})
    assert response.status_code==413
    assert response.headers['access-control-allow-origin']=='http://localhost:5173'
    assert client.post('/api/auth/login',content=b'{invalid',headers={'Content-Type':'application/json'}).status_code==422
