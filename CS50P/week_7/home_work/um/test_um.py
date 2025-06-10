from um import count

def test_um():
    assert count("um") == 1
    assert count("Um") == 1
    assert count("UM") == 1
    assert count("um um") == 2
    assert count("um, um.") == 2
    assert count("um, um. um") == 3
    assert count("um, um. um, um.") == 4
    assert count("um, um. um, um. um") == 5
    assert count("um, um. um, um. um, um.") == 6
    assert count("um, um. Um, UM.") == 4
    assert count("This is a test.") == 0
    assert count("") == 0

def test_um_in_words():
    assert count("yummy") == 0
    assert count("album") == 0
    assert count("umbrella") == 0
    assert count("Umbridge is a teacher") == 0
