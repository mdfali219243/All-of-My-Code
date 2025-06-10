import requests
import sys


def main():
    if len(sys.argv) == 2:
        try:
            response = requests.get(
                "https://api.artic.edu/api/v1/artworks/search",
                {"q": "" +sys.argv[1]}
                )
            response.raise_for_status()
        except requests.HTTPError:
            print("Couldn't complete the request")
            return
        print(response)
        content = response.json()
        for artwork in content["data"]:
            print(f"*{artwork['title']}")
    elif len(sys.argv) > 2:
        print("too many argument, sorry try agian")
    else:
        print("Too little argument")


main()
