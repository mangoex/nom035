import urllib.request, urllib.error
req = urllib.request.Request('http://localhost:8000/api/auth/register', method='POST')
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(e.code)
