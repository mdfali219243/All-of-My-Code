import re


def main():
    print(parse(input("HTML: ")))


def parse(s):
    pattern = r'<iframe.*?src="https?://(?:www\.)?youtube\.com/embed/([\w-]+)".*?>'
    matches = re.search(pattern, s)
    if matches:
        url = matches.group(1)
        video_id = url.split('/')[-1]
        return f"https://youtu.be/{video_id}"
    else:
        return None

if __name__ == "__main__":
    main()
