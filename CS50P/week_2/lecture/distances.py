distances = {
    "Voyager 1": 163,
    "Voyager 2": 136,
    "Pioneer 10": 80,
    "New Horuzons":58,
    "Pioneer 11": 44
}




def main():
    for name, distance in distances.items():
        print(f" For {name} the distance is {distance} AU in meters it would be {convert(distance)}")


def convert(au):
    return au * 149597870700

main()
