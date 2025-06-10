from plates import is_valid
def main():
    test_alphabeticalChecks()
    test_lengthCheck()
    test_numberPlacement()
    test_zeroCheck()
    test_alphanumeric()


def test_alphabeticalChecks():
    assert is_valid("CS50") == True
    assert is_valid("45AC") == False
    assert is_valid("C50") == False
    assert is_valid("5C50") == False
    assert is_valid("CC50") == True     




def test_lengthCheck():
    assert is_valid("HELLOW") == True
    assert is_valid("A") == False

def test_numberPlacement():
    assert is_valid("0AABD") == False
    assert is_valid("AA11B") == False

def test_zeroCheck():
    assert is_valid("AA01") == False
    assert is_valid("AAAA") == True

def test_alphanumeric():
    assert is_valid("AA@12") == False
    assert is_valid("ABC123") == True

if __name__ == "__main__":
    main()
