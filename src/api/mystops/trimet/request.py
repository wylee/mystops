import requests

from .exc import TriMetAPIError


BASE_URL = "http://developer.trimet.org/ws/v{version}/{service}"


def make_request(service, api_key, params=None, version=1):
    url = BASE_URL.format(service=service, version=version)
    default_params = {
        "appID": api_key,
        "json": "true",
    }
    params = {**default_params, **params}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise TriMetAPIError(
            f"Error calling TriMet API service: {service} ({response.url})"
        )
    return response
