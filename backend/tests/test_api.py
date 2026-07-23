"""
tests/test_api.py
Integration tests for the Flask REST API endpoints.
"""

def test_health_endpoint(client):
    """Test that the API is up and running."""
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
    assert response.json['module'] == 'api_routes'

def test_start_endpoint(client):
    """Test the /start endpoint delegates properly."""
    response = client.post('/api/v1/start', json={"camera_index": 0})
    assert response.status_code == 200
    assert response.json['status'] == 'success'

def test_stop_endpoint(client):
    """Test the /stop endpoint delegates properly."""
    response = client.post('/api/v1/stop')
    assert response.status_code == 200
    assert response.json['status'] == 'success'

def test_clear_endpoint(client):
    """Test the /clear endpoint delegates properly."""
    response = client.post('/api/v1/clear')
    assert response.status_code == 200
    assert response.json['status'] == 'success'

def test_recognize_endpoint(client):
    """Test the /recognize endpoint delegates properly."""
    response = client.post('/api/v1/recognize')
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert 'text' in response.json
